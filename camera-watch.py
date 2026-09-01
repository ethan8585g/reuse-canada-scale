#!/usr/bin/env python3
"""
camera-watch.py — RTSP camera monitor backed by Claude vision.

Grabs a still from an RTSP camera on an interval, asks Claude what it sees,
and raises an alert when the thing you care about shows up.

Written for the Camcamp yard camera (Camera 2) that feeds the scale-house
agent, but the watch condition is a profile, so it works for a porch camera
or a shop door just as well.

    ./camera-watch.py --profile scale-house
    ./camera-watch.py --profile generic --watch-for "a delivery van or a person carrying a package"

SETUP
    pip install anthropic Pillow
    brew install ffmpeg

    export ANTHROPIC_API_KEY=sk-ant-...
    export RTSP_USER=admin
    export RTSP_PASS=...            # never hardcode this; see the note below
    export RTSP_HOST=192.168.0.201

CREDENTIALS
    The camera password is read from the environment on purpose. An RTSP URL
    with the password baked in is a credential in plain text -- it lands in
    your shell history, in `ps` output for every user on the machine, and in
    this file if you paste it here. Put the exports in a file this repo
    already ignores (.env.camera) and `source` it.

COST
    A 5s interval is 17,280 Claude calls a day, and in a quiet yard almost
    every one of them looks at the same empty gravel. The motion gate (on by
    default) compares each frame to the last one and only spends a call when
    the scene actually changed. Expect it to skip 90-99% of frames. Turn it
    off with --no-motion-gate if you truly want every tick sent.
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import logging
import os
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Callable

from PIL import Image, ImageChops, ImageStat

# The model the API is called with. Claude 5 is current; the older
# claude-3-5-sonnet-20241022 still works if you have a reason to pin it.
DEFAULT_MODEL = "claude-sonnet-5"

# Long edge the snapshot is resized to before upload. A 1080p still costs
# roughly 4x the tokens of a 1024px one and tells Claude nothing extra about
# whether a truck is loaded.
MAX_EDGE_PX = 1024
JPEG_QUALITY = 80

log = logging.getLogger("camera-watch")


# ══════════════════════════════════════════════════════════════════
# PROFILES — what to watch for
# ══════════════════════════════════════════════════════════════════
@dataclass
class Profile:
    name: str
    question: str
    schema: str
    is_alert: Callable[[dict], bool]
    describe: Callable[[dict], str]


def _generic_profile(watch_for: str) -> Profile:
    return Profile(
        name="generic",
        question=(
            "You are watching a fixed security camera. Look at this frame and "
            f"decide whether the following is present:\n\n  {watch_for}\n\n"
            "Judge only what you can actually see. If the frame is dark, "
            "blurred, or the view is obstructed, say so and set detected to "
            "false rather than guessing."
        ),
        schema=(
            '{"detected": true|false, "confidence": 0.0-1.0, '
            '"summary": "one short sentence describing the frame"}'
        ),
        is_alert=lambda r: bool(r.get("detected")),
        describe=lambda r: r.get("summary", ""),
    )


def _scale_house_profile() -> Profile:
    return Profile(
        name="scale-house",
        question=(
            "You are watching the truck scale at a tire recycling yard. A truck "
            "drives onto the weighbridge loaded with scrap tires, tips its load "
            "in the yard, then drives back over the scale empty. Everything "
            "that crosses this scale is tires.\n\n"
            "Look at this frame and report:\n"
            "  - whether a vehicle is on or at the scale at all\n"
            "  - whether that vehicle is LOADED with tires or EMPTY\n"
            "  - anything distinctive about the truck that would let you "
            "recognise it again later (colour, body type, trailer, markings). "
            "Do NOT read or report licence plates.\n\n"
            "Be honest about uncertainty. A tarped or high-sided load can be "
            "impossible to call from this angle -- say 'unclear' rather than "
            "guessing, because a wrong call here closes the wrong ticket and "
            "bills the wrong customer."
        ),
        schema=(
            '{"vehicle_present": true|false, '
            '"load_state": "loaded"|"empty"|"unclear", '
            '"confidence": 0.0-1.0, '
            '"vehicle_description": "short distinguishing description, or null", '
            '"summary": "one short sentence"}'
        ),
        # A vehicle we can actually call is the event worth acting on. An
        # empty frame or an unreadable one is not an alert, it is just noise.
        is_alert=lambda r: bool(r.get("vehicle_present")) and r.get("load_state") in ("loaded", "empty"),
        describe=lambda r: "{} truck — {}".format(
            str(r.get("load_state", "?")).upper(),
            r.get("vehicle_description") or r.get("summary", ""),
        ),
    )


# ══════════════════════════════════════════════════════════════════
# FRAME CAPTURE
# ══════════════════════════════════════════════════════════════════
class FrameError(RuntimeError):
    pass


def grab_ffmpeg(url: str, timeout: float) -> bytes:
    """One fresh frame via ffmpeg.

    This is the default backend because OpenCV keeps an internal buffer on
    RTSP streams: poll it every 5s and you get a frame from minutes ago, so
    the monitor happily reports on a truck that left long ago. Spawning
    ffmpeg per snapshot costs a second of latency and is always current.

    -rtsp_transport tcp matters. The UDP default drops packets over wifi and
    hands back torn, half-green frames that Claude will describe in earnest.
    """
    cmd = [
        "ffmpeg", "-nostdin", "-loglevel", "error",
        "-rtsp_transport", "tcp",
        "-i", url,
        "-frames:v", "1",
        "-f", "image2", "-vcodec", "mjpeg", "-q:v", "3",
        "pipe:1",
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        raise FrameError(f"ffmpeg timed out after {timeout}s")
    except FileNotFoundError:
        raise FrameError("ffmpeg not found on PATH — brew install ffmpeg")
    if proc.returncode != 0 or not proc.stdout:
        err = (proc.stderr or b"").decode("utf-8", "replace").strip().splitlines()
        raise FrameError(err[-1] if err else f"ffmpeg exited {proc.returncode}")
    return proc.stdout


def grab_opencv(url: str, timeout: float) -> bytes:
    """Fallback backend. Kept because some cameras behave better with it.

    The read-and-discard loop is not superstition: it is the only way to get
    past OpenCV's buffered frames and reach a current one.
    """
    try:
        import cv2  # imported lazily so the ffmpeg path needs no opencv
    except ImportError:
        raise FrameError("opencv backend needs: pip install opencv-python")

    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
    try:
        if not cap.isOpened():
            raise FrameError("could not open the stream")
        try:
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        except Exception:
            pass
        deadline = time.time() + timeout
        frame = None
        for _ in range(10):                      # drain stale buffered frames
            if time.time() > deadline:
                break
            ok, f = cap.read()
            if ok:
                frame = f
        if frame is None:
            raise FrameError("no frame read from the stream")
        ok, buf = cv2.imencode(".jpg", frame)
        if not ok:
            raise FrameError("failed to encode the frame as JPEG")
        return buf.tobytes()
    finally:
        cap.release()


def prepare_image(raw: bytes) -> tuple[bytes, Image.Image]:
    """Downscale for the API, and return a small greyscale copy for the gate."""
    img = Image.open(io.BytesIO(raw))
    img.load()
    if img.mode != "RGB":
        img = img.convert("RGB")
    if max(img.size) > MAX_EDGE_PX:
        ratio = MAX_EDGE_PX / float(max(img.size))
        img = img.resize((max(1, int(img.width * ratio)),
                          max(1, int(img.height * ratio))), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=JPEG_QUALITY)
    thumb = img.convert("L").resize((64, 64), Image.BILINEAR)
    return out.getvalue(), thumb


# ══════════════════════════════════════════════════════════════════
# MOTION GATE
# ══════════════════════════════════════════════════════════════════
class MotionGate:
    """Skip the API call when the frame is the same gravel as last time.

    Mean absolute difference over a 64x64 greyscale thumbnail. Crude on
    purpose -- it only has to answer "did anything change", and it costs
    microseconds against a call that costs money.
    """

    def __init__(self, threshold: float, force_every: int):
        self.threshold = threshold
        self.force_every = force_every       # send anyway every N skips
        self.prev: Image.Image | None = None
        self.skipped = 0

    def should_send(self, thumb: Image.Image) -> tuple[bool, float]:
        if self.prev is None:
            self.prev = thumb
            return True, 999.0
        diff = ImageChops.difference(self.prev, thumb)
        score = ImageStat.Stat(diff).mean[0]
        self.prev = thumb
        if score >= self.threshold:
            self.skipped = 0
            return True, score
        self.skipped += 1
        if self.force_every and self.skipped >= self.force_every:
            self.skipped = 0
            return True, score           # periodic heartbeat past the gate
        return False, score


# ══════════════════════════════════════════════════════════════════
# CLAUDE
# ══════════════════════════════════════════════════════════════════
class Watcher:
    def __init__(self, model: str, profile: Profile, max_tokens: int = 400):
        try:
            import anthropic
        except ImportError:
            sys.exit("Missing dependency. Run: pip install anthropic Pillow")
        if not os.environ.get("ANTHROPIC_API_KEY"):
            sys.exit("ANTHROPIC_API_KEY is not set.")
        self.client = anthropic.Anthropic()
        self.model = model
        self.profile = profile
        self.max_tokens = max_tokens

    def look(self, jpeg: bytes) -> dict[str, Any]:
        prompt = (
            f"{self.profile.question}\n\n"
            f"Reply with JSON only, exactly this shape:\n{self.profile.schema}"
        )
        resp = self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": base64.standard_b64encode(jpeg).decode(),
                            },
                        },
                        {"type": "text", "text": prompt},
                    ],
                },
                # Prefilling an open brace forces JSON out of the first token,
                # so there is no prose or ``` fence to strip before parsing.
                {"role": "assistant", "content": "{"},
            ],
        )
        text = "{" + "".join(b.text for b in resp.content if b.type == "text")
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            end = text.rfind("}")
            if end > 0:
                try:
                    return json.loads(text[: end + 1])
                except json.JSONDecodeError:
                    pass
            raise FrameError(f"could not parse Claude's reply: {text[:200]}")


# ══════════════════════════════════════════════════════════════════
# ALERTING
# ══════════════════════════════════════════════════════════════════
@dataclass
class Alerter:
    webhook: str | None = None
    cooldown: int = 60
    snapshot_dir: str | None = None
    _last: float = field(default=0.0, init=False)

    def fire(self, profile: Profile, result: dict, jpeg: bytes) -> None:
        now = time.time()
        if now - self._last < self.cooldown:
            log.info("  (within %ss cooldown — not re-alerting)", self.cooldown)
            return
        self._last = now

        log.warning("ALERT  %s", profile.describe(result))
        log.warning("       %s", json.dumps(result, ensure_ascii=False))

        if self.snapshot_dir:
            os.makedirs(self.snapshot_dir, exist_ok=True)
            path = os.path.join(
                self.snapshot_dir, time.strftime("%Y%m%d-%H%M%S") + ".jpg"
            )
            with open(path, "wb") as fh:
                fh.write(jpeg)
            log.warning("       saved %s", path)

        if self.webhook:
            payload = json.dumps({
                "source": "camera-watch",
                "profile": profile.name,
                "at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "result": result,
            }).encode()
            req = urllib.request.Request(
                self.webhook, data=payload,
                headers={"Content-Type": "application/json"},
            )
            token = os.environ.get("CRM_BEARER_TOKEN")
            if token:
                req.add_header("Authorization", f"Bearer {token}")
            try:
                with urllib.request.urlopen(req, timeout=10) as r:
                    log.warning("       webhook %s", r.status)
            except urllib.error.URLError as e:
                # A dead webhook must never take the monitor down with it.
                log.error("       webhook failed: %s", e)


# ══════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════
def build_url(args) -> str:
    if args.url:
        return args.url
    user = os.environ.get("RTSP_USER", "admin")
    password = os.environ.get("RTSP_PASS")
    if not password:
        sys.exit(
            "RTSP_PASS is not set.\n"
            "  export RTSP_USER=admin\n"
            "  export RTSP_PASS='your-camera-password'\n"
            "Or pass a full --url (but note it will be visible in `ps` output)."
        )
    host = os.environ.get("RTSP_HOST", args.host)
    return f"rtsp://{user}:{password}@{host}:{args.port}{args.path}"


def redact(url: str) -> str:
    """Never let the password reach a log file."""
    if "@" not in url:
        return url
    scheme, rest = url.split("://", 1)
    creds, host = rest.split("@", 1)
    user = creds.split(":", 1)[0]
    return f"{scheme}://{user}:***@{host}"


def main() -> int:
    p = argparse.ArgumentParser(
        description="Watch an RTSP camera with Claude vision.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--url", help="full RTSP URL (else built from RTSP_* env vars)")
    p.add_argument("--host", default="192.168.0.201")
    p.add_argument("--port", type=int, default=554)
    p.add_argument("--path", default="/live/ch01_1",
                   help="/live/ch01_1 is the sub-stream (default, cheaper); "
                        "/live/ch01_0 is full resolution")
    p.add_argument("--interval", type=float, default=5.0, help="seconds between frames")
    p.add_argument("--profile", choices=["generic", "scale-house"], default="scale-house")
    p.add_argument("--watch-for", default="a person or a vehicle that should not be there",
                   help="what to look for (generic profile only)")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--backend", choices=["ffmpeg", "opencv"], default="ffmpeg")
    p.add_argument("--grab-timeout", type=float, default=15.0)
    p.add_argument("--motion-threshold", type=float, default=2.5,
                   help="mean pixel change (0-255) needed to spend an API call")
    p.add_argument("--no-motion-gate", action="store_true")
    p.add_argument("--heartbeat-frames", type=int, default=120,
                   help="send one frame anyway after this many gated skips (0 = never)")
    p.add_argument("--cooldown", type=int, default=60, help="seconds between repeat alerts")
    p.add_argument("--webhook", help="POST each alert as JSON to this URL")
    p.add_argument("--save-alerts", metavar="DIR", help="write alerting frames to DIR")
    p.add_argument("--log-file", default="camera-watch.log")
    p.add_argument("--once", action="store_true", help="single frame, then exit (for testing)")
    p.add_argument("--verbose", "-v", action="store_true")
    args = p.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s  %(levelname)-7s %(message)s",
        datefmt="%H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout),
                  logging.FileHandler(args.log_file)],
    )

    url = build_url(args)
    profile = (_scale_house_profile() if args.profile == "scale-house"
               else _generic_profile(args.watch_for))
    grab = grab_ffmpeg if args.backend == "ffmpeg" else grab_opencv
    watcher = Watcher(args.model, profile)
    alerter = Alerter(webhook=args.webhook, cooldown=args.cooldown,
                      snapshot_dir=args.save_alerts)
    gate = None if args.no_motion_gate else MotionGate(
        args.motion_threshold, args.heartbeat_frames)

    running = True

    def stop(_sig, _frm):
        nonlocal running
        running = False
        log.info("stopping…")

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)

    log.info("camera   %s", redact(url))
    log.info("profile  %s   model %s   every %.1fs", profile.name, args.model, args.interval)
    log.info("gate     %s", "off" if gate is None else
             f"motion >= {args.motion_threshold}")

    calls = frames = 0
    backoff = 1.0

    while running:
        started = time.time()
        frames += 1
        try:
            raw = grab(url, args.grab_timeout)
            jpeg, thumb = prepare_image(raw)
            backoff = 1.0

            if gate is not None:
                send, score = gate.should_send(thumb)
                if not send:
                    log.debug("frame %d quiet (%.2f) — skipped", frames, score)
                    if args.once:
                        break
                    time.sleep(max(0.0, args.interval - (time.time() - started)))
                    continue
                log.debug("frame %d changed (%.2f) — asking Claude", frames, score)

            result = watcher.look(jpeg)
            calls += 1
            if profile.is_alert(result):
                alerter.fire(profile, result, jpeg)
            else:
                log.info("clear — %s", profile.describe(result) or "nothing of note")

        except FrameError as e:
            # A camera that drops off wifi is normal. Back off, keep going.
            log.error("frame %d: %s", frames, e)
            time.sleep(min(backoff, 60))
            backoff *= 2
        except Exception as e:                       # noqa: BLE001
            log.exception("frame %d: unexpected: %s", frames, e)
            time.sleep(min(backoff, 60))
            backoff *= 2

        if args.once:
            break
        time.sleep(max(0.0, args.interval - (time.time() - started)))

    log.info("done — %d frames, %d Claude calls (%.0f%% gated out)",
             frames, calls, 100.0 * (1 - calls / frames) if frames else 0.0)
    return 0


if __name__ == "__main__":
    sys.exit(main())
