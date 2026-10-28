// Run: node verify-prototype.mjs. No browser, hardware, network or production writes.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const scripts=['cameras.js','vault.js','unattended.js','personalize.js','app.js'];
for(const s of scripts)execFileSync(process.execPath,['--check',path.join(root,s)]);
const html=read('index.html');
for(const s of scripts)assert(html.includes('<script src="'+s+'"></script>'),s+' is wired');
assert.deepEqual([...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]),scripts);
const listeners={};
const element={addEventListener(){},setAttribute(){},outerHTML:'<svg viewBox="0 0 600 300"></svg>'};
const context=vm.createContext({
 document:{addEventListener:(k,fn)=>(listeners[k]??=[]).push(fn),getElementById:()=>element,querySelector:()=>element},
 state:{settings:{mode:'off'},cameras:[{id:'scale',enabled:true}],activeCamera:'scale',photoCamera:'scale'},
 $:()=>null,save(){},toast(){},requireAuto(){return context.state.settings.mode==='live'},
 FormData:class{constructor(){throw Error('Disabled unattended form reached mutation preparation')}},
});
vm.runInContext(read('unattended.js'),context);
for(const mode of ['off','assisted','dry']){
 context.state.settings.mode=mode;
 for(const f of ['startDriver()','autoWeigh("missing")','autoIncident(null,"test")'])vm.runInContext(f,context);
 for(const id of ['driver-start','driver-confirm','auto-weigh-form','auto-resolve-form']){
  for(const listener of listeners.submit)listener({target:{id},preventDefault(){}});
 }
}
vm.runInContext(read('cameras.js'),context);
// Stub only painting; exercise the actual persisted motion bounds.
vm.runInContext('paintCameraPosition=()=>{}',context);
for(let i=0;i<30;i++)vm.runInContext('moveCamera("right");moveCamera("up");moveCamera("in")',context);
assert.equal(context.state.cameras[0].ptz.x,-20);assert.equal(context.state.cameras[0].ptz.y,20);assert.equal(context.state.cameras[0].ptz.z,3);
vm.runInContext('moveCamera("home")',context);
assert.equal(context.state.cameras[0].ptz.x,0);assert.equal(context.state.cameras[0].ptz.z,1);
context.state.cameras[0].enabled=false;vm.runInContext('moveCamera("in")',context);assert.equal(context.state.cameras[0].ptz.z,1);
vm.runInContext(read('personalize.js'),context);
assert.equal(vm.runInContext('inkOn("#ffffff")',context),'#13231b');assert.equal(vm.runInContext('inkOn("#000000")',context),'#ffffff');
console.log('PASS: script syntax/order, non-Auto mutation guards, PTZ bounds/home/pause, contrast extremes. These are focused prototype checks, not production integration tests.');
