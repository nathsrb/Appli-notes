/**
 * ÉTERNEL movement kernel.
 * Pure mathematical functions; no browser/WebGL necessary for regression tests.
 */
export const WORLD_LIMITS=Object.freeze({minX:-286,maxX:286,minZ:-314,maxZ:251});
export const WALK_SPEED=12.5;
export const RUN_SPEED=20.5;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pressed=(keys,...values)=>values.some(k=>keys.has(k));
export function getInputAxes(keys,stick={x:0,y:0},gamepad=null){
 const forward=Number(pressed(keys,'z','w','arrowup'))-Number(pressed(keys,'s','arrowdown'));
 const side=Number(pressed(keys,'d'))-Number(pressed(keys,'q','a'));
 const gpX=gamepad?.axes?.[0]||0,gpY=gamepad?.axes?.[1]||0;
 const dx=side+stick.x+(Math.abs(gpX)>.16?gpX:0);
 const dy=forward-stick.y-(Math.abs(gpY)>.16?gpY:0);
 const len=Math.hypot(dx,dy);
 return len>1?{x:dx/len,y:dy/len}:{x:dx,y:dy};
}
export function integrateMovement(origin,yaw,axes,delta,options={}){
 const dt=clamp(Number.isFinite(delta)?delta:0,0,.06);
 const speed=options.sprint?RUN_SPEED:WALK_SPEED;
 const f=clamp(axes.y||0,-1,1),s=clamp(axes.x||0,-1,1);
 const rightX=Math.cos(yaw),rightZ=Math.sin(yaw);
 const forwardX=Math.sin(yaw),forwardZ=-Math.cos(yaw);
 const desiredX=(forwardX*f+rightX*s)*speed*dt;
 const desiredZ=(forwardZ*f+rightZ*s)*speed*dt;
 const bounds=options.bounds||WORLD_LIMITS;
 let x=clamp(origin.x+desiredX,bounds.minX,bounds.maxX);
 let z=clamp(origin.z+desiredZ,bounds.minZ,bounds.maxZ);
 const obstacles=options.obstacles||[];
 // Most decorative plants are non-blocking, preventing jungle spawn traps.
 for(const b of obstacles){
  const radius=b.radius||0;
  if(radius<=0)continue;
  const prev=Math.hypot(origin.x-b.x,origin.z-b.z);
  const next=Math.hypot(x-b.x,z-b.z);
  // If the player spawned in a prop, moving outward is always allowed.
  if(next>=radius||next>prev+.00001)continue;
  // Slide tangentially along obstacles instead of freezing completely.
  const nx=(origin.x-b.x)/(prev||1),nz=(origin.z-b.z)/(prev||1);
  const dot=desiredX*nx+desiredZ*nz;
  const slideX=desiredX-dot*nx,slideZ=desiredZ-dot*nz;
  x=clamp(origin.x+slideX,bounds.minX,bounds.maxX);
  z=clamp(origin.z+slideZ,bounds.minZ,bounds.maxZ);
  if(Math.hypot(x-b.x,z-b.z)<radius){
   x=clamp(origin.x,bounds.minX,bounds.maxX);
   z=clamp(origin.z,bounds.minZ,bounds.maxZ);
  }
 }
 const traveled=Math.hypot(x-origin.x,z-origin.z);
 return {x,z,traveled,moving:traveled>.0001,requested:Math.hypot(desiredX,desiredZ)};
}
export function getCompassDirection(yaw){
 const names=['N','NE','E','SE','S','SO','O','NO'];
 const angle=(yaw%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
 return names[Math.round(angle/(Math.PI/4))%8];
}
