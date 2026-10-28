/* Multi-camera presentation demo. No network feeds are requested. */
const cameraArt = document.querySelector('#camera-scene svg').outerHTML;
let cameraEditing = null;
function ensureCameras(){
  if(!state.cameras)state.cameras=[
    {id:'scale',name:'Truck scale',source:'Network camera',address:'',enabled:true,view:0},
    {id:'entry',name:'Entry gate',source:'Network camera',address:'',enabled:true,view:1},
    {id:'yard',name:'Unloading yard',source:'Network camera',address:'',enabled:false,view:2}
  ];
  if(!state.cameras.some(c=>c.id===state.activeCamera))state.activeCamera=state.cameras[0].id;
  if(!state.cameras.some(c=>c.id===state.photoCamera))state.photoCamera=state.cameras[0].id;
}
function activeCamera(){ensureCameras();return state.cameras.find(c=>c.id===state.activeCamera)}
function cameraScene(c,clock=false){
  const art=cameraArt.replaceAll('id="sky"','id="sky-'+c.id+'"').replaceAll('url(#sky)','url(#sky-'+c.id+')').replace('viewBox="0 0 600 300"','viewBox="'+(['0 0 600 300','170 80 280 180','0 60 600 240'][c.view%3])+'"');
  return '<div class="camera-tags"><span><i class="dot '+(c.enabled?'green':'')+'"></i> '+(c.enabled?'DEMO FEED':'PAUSED')+'</span><span>'+esc(c.name)+'</span></div><div class="camera-art view-'+c.view%3+' '+(!c.enabled?'is-paused':'')+'">'+art+'</div>'+(!c.enabled?'<div class="camera-paused">Camera paused</div>':'')+'<div class="camera-bottom"><span>'+(state.photoCamera===c.id?'Ticket photo camera':'Illustrated sample view')+'</span><span '+(clock?'id="camera-clock"':'')+'>'+new Date().toLocaleTimeString('en-CA',{hour12:false})+'</span></div>';
}
function renderCameras(){
  ensureCameras();const c=activeCamera();
  $('camera-count').textContent=state.cameras.length;
  $('camera-switcher').innerHTML=state.cameras.map(cam=>'<button class="'+(cam.id===c.id?'active':'')+'" data-camera-select="'+cam.id+'" aria-pressed="'+(cam.id===c.id)+'"><i class="dot '+(cam.enabled?'green':'')+'"></i>'+esc(cam.name)+'</button>').join('');
  $('camera-scene').innerHTML=cameraScene(c,true);
  document.querySelector('.status-strip [data-action="camera"]').textContent=state.cameras.filter(c=>c.enabled).length+'/'+state.cameras.length+' cameras ready ↗';
  document.querySelector('.camera-actions [data-action="snapshot"]').disabled=!c.enabled;
  $('snapshot-note').hidden=!c.snapshot;
  $('snapshot-note').textContent=c.snapshot?'✓ '+c.name+' · sample snapshot at '+c.snapshot:'';
}
function cameraWall(){
  ensureCameras();modal('All cameras','<p class="modal-intro">See every angle of the yard. Select a view to inspect it. Each camera has its own connection and photo settings.</p><div class="camera-wall">'+state.cameras.map(c=>'<button class="camera-tile" data-camera-open="'+c.id+'"><div class="camera-scene">'+cameraScene(c)+'</div><div class="camera-tile-label"><strong>'+esc(c.name)+'</strong><span>'+(!c.enabled?'Paused':state.photoCamera===c.id?'Ticket photos':'Ready')+' ↗</span></div></button>').join('')+'</div><div class="modal-actions"><button class="button" data-action="close">Close</button><button class="button primary" data-camera-command="manage">Manage cameras</button></div>','CAMERA OVERVIEW');$('modal').classList.add('camera-wide');
}
let cameraTalking=false;
function cameraDetail(id){
 cameraTalking=false;state.activeCamera=id;save();const c=activeCamera();
 modal(c.name,'<div class="camera-console"><div class="camera-stage"><div id="camera-full-scene" class="camera-scene">'+cameraScene(c)+'</div><div id="talk-indicator" hidden>● TALK PREVIEW · no audio transmitted</div><span class="camera-demo-note">Illustrated feed · movement and two-way audio are simulated</span></div><aside class="camera-controls"><div class="camera-control-heading"><span class="eyebrow">CAMERA CONTROLS</span><span class="pill '+(c.enabled?'good':'')+'">'+(c.enabled?'Demo ready':'Paused')+'</span></div><button class="button primary" data-camera-command="snapshot" '+(!c.enabled?'disabled':'')+'>◉ Take picture</button><p id="full-capture-status" role="status">Pictures are saved to Photo Vault.</p><div class="camera-control-group"><h3>Move camera</h3><div class="camera-pad">'+[['up','↑','Tilt up'],['left','←','Pan left'],['home','⌂','Return to centre'],['right','→','Pan right'],['down','↓','Tilt down']].map(([d,icon,label])=>'<button class="button pad-'+d+'" data-camera-move="'+d+'" aria-label="'+label+'" '+(!c.enabled?'disabled':'')+'>'+icon+'</button>').join('')+'</div><div class="camera-zoom"><button class="button" data-camera-move="out" aria-label="Zoom out" '+(!c.enabled?'disabled':'')+'>−</button><output id="camera-zoom-label">1.0×</output><button class="button" data-camera-move="in" aria-label="Zoom in" '+(!c.enabled?'disabled':'')+'>＋</button></div><small>Simulated pan, tilt and zoom</small></div><div class="camera-control-group"><h3>Talk to the driver</h3><button class="button talk-button" id="camera-talk" data-camera-talk aria-pressed="false" '+(!c.enabled?'disabled':'')+'>♩ Start talking</button><p id="camera-talk-status" role="status">Try two-way audio. No microphone is accessed.</p></div><div class="camera-secondary"><button class="button" data-camera-command="pause">'+(c.enabled?'Pause camera':'Resume camera')+'</button><button class="button" data-camera-command="all">← All cameras</button><button class="text-button" data-camera-vault>Open Photo Vault →</button></div></aside></div>','FULL-SCREEN CAMERA · DEMO');$('modal').classList.add('camera-fullscreen');paintCameraPosition();
}
function paintCameraPosition(){const c=activeCamera(),p=c.ptz||{x:0,y:0,z:1};const art=document.querySelector('#camera-full-scene .camera-art');if(art)art.style.transform='translate('+p.x+'%, '+p.y+'%) scale('+p.z+')';if($('camera-zoom-label'))$('camera-zoom-label').textContent=p.z.toFixed(1)+'×';}
function moveCamera(direction){const c=activeCamera();if(!c.enabled)return;const p=c.ptz||{x:0,y:0,z:1};if(direction==='home'){p.x=0;p.y=0;p.z=1}else if(direction==='in'||direction==='out')p.z=Math.max(1,Math.min(3,Math.round((p.z+(direction==='in'?.2:-.2))*10)/10));else{if(direction==='left')p.x=Math.min(20,p.x+5);if(direction==='right')p.x=Math.max(-20,p.x-5);if(direction==='up')p.y=Math.min(20,p.y+5);if(direction==='down')p.y=Math.max(-20,p.y-5);}c.ptz=p;save();paintCameraPosition();}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.cameraMove)moveCamera(b.dataset.cameraMove);if(b.hasAttribute('data-camera-talk')&&activeCamera().enabled){cameraTalking=!cameraTalking;b.setAttribute('aria-pressed',String(cameraTalking));b.textContent=cameraTalking?'■ Stop talking':'♩ Start talking';$('talk-indicator').hidden=!cameraTalking;$('camera-talk-status').textContent=cameraTalking?'Talk preview active. No microphone or audio transmission.':'Talk preview stopped. No audio was transmitted.';}if(b.hasAttribute('data-camera-vault')){close();openVault();}});
document.getElementById('modal').addEventListener('close',()=>{cameraTalking=false;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&cameraTalking){cameraTalking=false;if($('camera-talk')){$('camera-talk').setAttribute('aria-pressed','false');$('camera-talk').textContent='♩ Start talking';$('talk-indicator').hidden=true;$('camera-talk-status').textContent='Talk preview stopped while away.';}}});
function snapshotCamera(){const c=activeCamera();if(!c.enabled)return toast('Resume '+c.name+' before taking a snapshot.');c.snapshot=new Date().toLocaleTimeString('en-CA');captureManualVault(c);if($('full-capture-status'))$('full-capture-status').textContent='Capture queued · '+c.snapshot+' · check Photo Vault for save status.';record('Sample snapshot · '+c.name);save();toast(c.name+': sample capture queued for Photo Vault.')}
function cameraManager(){
  ensureCameras();modal('Manage cameras','<p class="modal-intro">Give each camera a recognisable name. Pick one for automatic ticket photos; the others stay available for checking the yard.</p><div class="choice-list">'+state.cameras.map(c=>'<button class="choice" data-camera-edit="'+c.id+'"><span>◉</span><div><strong>'+esc(c.name)+'</strong><small>'+esc(c.source)+' · '+(c.enabled?'Ready':'Paused')+(state.photoCamera===c.id?' · Ticket photos':'')+'</small></div><span class="arrow">Edit →</span></button>').join('')+'</div><div class="modal-actions"><button class="button" data-camera-command="all">All cameras</button><button class="button primary" data-camera-command="add">＋ Add camera</button></div>','STATION CAMERAS');
}
function cameraEditor(id){
  cameraEditing=id;const c=state.cameras.find(c=>c.id===id)||{name:'',source:'Network camera',address:'',enabled:true};
  modal(id?'Camera settings':'Add a camera','<form id="camera-form"><label class="field">Camera name<input name="name" required maxlength="50" value="'+esc(c.name)+'" placeholder="e.g. Rear licence plate"></label><label class="field">Camera source<select name="source">'+['Network camera','USB webcam','Scale Bridge camera'].map(v=>'<option '+(v===c.source?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label class="field">Camera address or device ID<input name="address" value="'+esc(c.address)+'" placeholder="Address or device identifier"><small>Demo only. This address is stored locally and is never contacted.</small></label>'+check('enabled','Camera enabled','Keep this camera available in the station overview.',c.enabled)+check('ticketPhotos','Use for ticket photos','Use this angle for weigh-in and weigh-out photos. Only one camera is selected at a time.',state.photoCamera===id)+'<p class="settings-note">All preview feeds are illustrations. Real camera discovery and connection belong to the production implementation.</p><div class="modal-actions"><button class="button" type="button" data-camera-command="manage">Cancel</button>'+(id&&state.cameras.length>1?'<button class="button danger" type="button" data-camera-remove="'+id+'">Remove</button>':'')+'<button class="button primary" type="submit">Save camera</button></div></form>','CAMERA SETUP');
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.cameraSelect){state.activeCamera=b.dataset.cameraSelect;save()}
 if(b.dataset.cameraOpen)cameraDetail(b.dataset.cameraOpen);
 if(b.dataset.cameraEdit)cameraEditor(b.dataset.cameraEdit);
 if(b.dataset.cameraRemove){const id=b.dataset.cameraRemove;modal('Remove this camera?','<p class="modal-intro">Remove '+esc(state.cameras.find(c=>c.id===id).name)+' from the demo station? You can add it again. If it supplies ticket photos, the first remaining camera will take that role.</p><div class="modal-actions"><button class="button" data-camera-command="manage">Cancel</button><button class="button danger" data-camera-confirm-remove="'+id+'">Remove camera</button></div>')}
 if(b.dataset.cameraConfirmRemove){state.cameras=state.cameras.filter(c=>c.id!==b.dataset.cameraConfirmRemove);ensureCameras();save();cameraManager();toast('Camera removed from the demo.')}
 switch(b.dataset.cameraCommand){case'all':cameraWall();break;case'manage':cameraManager();break;case'add':cameraEditor(null);break;case'pause':{const c=activeCamera();c.enabled=!c.enabled;save();cameraDetail(c.id);break}case'snapshot':snapshotCamera();break}
});
document.addEventListener('submit',e=>{
 if(e.target.id!=='camera-form')return;e.preventDefault();const d=new FormData(e.target),name=String(d.get('name')).trim();if(!name)return toast('Enter a camera name.');
 let c=state.cameras.find(c=>c.id===cameraEditing);if(!c){c={id:'cam-'+Date.now(),view:state.cameras.length%3};state.cameras.push(c)}
 Object.assign(c,{name,source:String(d.get('source')),address:String(d.get('address')).trim(),enabled:d.has('enabled')});
 if(d.has('ticketPhotos'))state.photoCamera=c.id;else if(state.photoCamera===c.id){const other=state.cameras.find(x=>x.id!==c.id);if(other)state.photoCamera=other.id}
 state.activeCamera=c.id;save();cameraManager();toast('Camera saved. '+state.cameras.find(c=>c.id===state.photoCamera).name+' supplies ticket photos.');
});

const mainCameraScene=document.getElementById('camera-scene');mainCameraScene.setAttribute('role','button');mainCameraScene.setAttribute('tabindex','0');mainCameraScene.setAttribute('aria-label','Open camera full screen');mainCameraScene.addEventListener('click',()=>cameraDetail(activeCamera().id));mainCameraScene.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();cameraDetail(activeCamera().id);}});
