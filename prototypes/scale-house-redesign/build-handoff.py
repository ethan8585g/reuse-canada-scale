"""Rebuild portable preview, compact Claude archive, and full reference archive."""
from pathlib import Path
import hashlib, json, re, subprocess, tempfile, zipfile
p = Path(__file__).resolve().parent
scripts = ['cameras.js','vault.js','unattended.js','personalize.js','app.js']
subprocess.run(['node',str(p/'verify-prototype.mjs')],check=True)
h = (p/'index.html').read_text().replace('<link rel="stylesheet" href="styles.css">','<style>\n'+(p/'styles.css').read_text()+'\n</style>')
for n in scripts:
    h = h.replace('<script src="'+n+'"></script>','<script>\n'+(p/n).read_text()+'\n</script>')
for s in re.findall(r'<script>(.*?)</script>',h,re.S):
    with tempfile.NamedTemporaryFile(suffix='.js',mode='w') as f:
        f.write(s);f.flush();subprocess.run(['node','--check',f.name],check=True)
(p/'scale-house-prototype.html').write_text(h)
files = ['00-START-HERE.md','01-FINAL-SPEC.md','02-SOURCE-MAP.md','03-VERIFICATION.md','PASTE-INTO-CLAUDE.txt','CLAUDE-PROMPT.md','index.html','styles.css',*scripts,'verify-prototype.mjs']
contents = {n:(p/n).read_bytes() for n in files}
# Local handoff buttons inside extracted compact package must resolve without nested ZIPs.
a=contents['app.js'].decode().replace('href="claude-ready.zip" download>↓ Download compact Claude package','href="00-START-HERE.md" download>↓ Read this first').replace('href="scale-house-prototype.html" download>↓ Download single-file interactive prototype','href="02-SOURCE-MAP.md" download>↓ Source map').replace('href="HANDOFF.md"','href="01-FINAL-SPEC.md"')
contents['app.js']=a.encode()
with tempfile.NamedTemporaryFile(suffix='.js',mode='w') as f:
    f.write(a);f.flush();subprocess.run(['node','--check',f.name],check=True)
for n in ['station-copilot.png','branding-settings.png','fullscreen-camera.png']:
    contents['screenshots/'+n]=(p/n).read_bytes()
manifest={n:hashlib.sha256(data).hexdigest() for n,data in contents.items()}
contents['MANIFEST-SHA256.json']=(json.dumps(manifest,indent=2)+'\n').encode()
with zipfile.ZipFile(p/'claude-ready.zip','w',zipfile.ZIP_DEFLATED) as z:
    for n,data in contents.items():z.writestr('scale-house-redesign/'+n,data)
with zipfile.ZipFile(p/'claude-ready.zip') as z:
    assert z.testzip() is None
    for n,digest in manifest.items():assert hashlib.sha256(z.read('scale-house-redesign/'+n)).hexdigest()==digest
    # Check local static references in the runnable compact copy.
    for file in ['index.html','app.js']:
        for ref in re.findall(r'(?:src|href)="([^"\s]+)"',z.read('scale-house-redesign/'+file).decode()):
            if ref.startswith(('#','data:','http')) or "'" in ref or '+' in ref:continue
            assert ref in contents,(file,ref)
with zipfile.ZipFile(p/'scale-house-handoff.zip','w',zipfile.ZIP_DEFLATED) as z:
    for q in sorted(p.iterdir()):
        if q.suffix in {'.html','.css','.js','.mjs','.py','.md','.txt','.png'}:z.write(q,'scale-house-redesign/'+q.name)
with zipfile.ZipFile(p/'scale-house-handoff.zip') as z:assert z.testzip() is None
print('PASS: standalone inline syntax, compact references, both ZIPs and compact SHA-256 manifest.')
print('Compact:',(p/'claude-ready.zip').stat().st_size,'bytes; full archive:',(p/'scale-house-handoff.zip').stat().st_size,'bytes.')
