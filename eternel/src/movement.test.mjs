import test from 'node:test';
import assert from 'node:assert/strict';
import {getInputAxes,integrateMovement,WORLD_LIMITS} from './movement.js';
const close=(a,b,t=.025)=>assert.ok(Math.abs(a-b)<t,String(a)+' != '+String(b));
const K=(...a)=>new Set(a);
test('W/Z/Up move forward into the world',()=>{
 for(const key of ['w','z','arrowup']){
  const a=getInputAxes(K(key));close(a.y,1);close(a.x,0);
  const p=integrateMovement({x:5,z:192},0,a,.05);
  assert.ok(p.z<192&&p.traveled>.4);
 }
});
test('S reverses, A/Q strafe left and D right',()=>{
 close(getInputAxes(K('s')).y,-1);
 close(getInputAxes(K('q')).x,-1);
 close(getInputAxes(K('a')).x,-1);
 close(getInputAxes(K('d')).x,1);
 const back=integrateMovement({x:5,z:192},0,getInputAxes(K('s')),.04);
 assert.ok(back.z>192);
 const side=integrateMovement({x:5,z:192},0,getInputAxes(K('d')),.04);
 assert.ok(side.x>5);
});
test('touch joystick travels 25 metres without keyboard',()=>{
 let p={x:5,z:192};
 for(let i=0;i<140;i++)p=integrateMovement(p,0,getInputAxes(K(),{x:.3,y:-.9}),1/60);
 assert.ok(p.z<167&&p.x>12);
});
test('90-degree rotation turns forward into X axis',()=>{
 const p=integrateMovement({x:0,z:0},Math.PI/2,getInputAxes(K('w')),.05);
 assert.ok(p.x>.55);close(p.z,0);
});
test('diagonal walk/run never exceeds speed',()=>{
 const a=getInputAxes(K('w','d'));
 const fast=integrateMovement({x:0,z:0},0,a,.05,{sprint:true});
 assert.ok(fast.traveled>0.9&&fast.traveled<1.04);
 const slow=integrateMovement({x:0,z:0},0,a,.05);
 assert.ok(slow.traveled>.57&&slow.traveled<.64);
});
test('dense decorative forest never blocks initial 45-metre walk',()=>{
 let p={x:5,z:192},sum=0;
 for(let i=0;i<220;i++){
  const n=integrateMovement(p,0,getInputAxes(K('w')),1/60,{obstacles:[{x:-12,z:-35,radius:6}]});
  sum+=n.traveled;p=n;
 }
 assert.ok(sum>43);
});
test('can recover if spawned within an obstacle',()=>{
 const p=integrateMovement({x:0,z:0},Math.PI/2,getInputAxes(K('w')),.05,{obstacles:[{x:0,z:0,radius:4}]});
 assert.ok(p.x>.58);
});
test('can strafe along monument',()=>{
 const p=integrateMovement({x:0,z:5.9},0,getInputAxes(K('w','d')),.05,{obstacles:[{x:0,z:0,radius:6}]});
 assert.ok(p.x>.1,JSON.stringify(p));
});
test('world bounds keep player finite',()=>{
 const p=integrateMovement({x:WORLD_LIMITS.maxX-.1,z:0},Math.PI/2,getInputAxes(K('w')),.06);
 assert.ok(p.x<=WORLD_LIMITS.maxX);
});
test('gamepad forward works, small drift ignored',()=>{
 close(getInputAxes(K(),{x:0,y:0},{axes:[.04,-1]}).y,1);
 close(getInputAxes(K(),{x:0,y:0},{axes:[.05,.05]}).x,0);
});
