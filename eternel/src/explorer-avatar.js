import * as THREE from 'three';
/** Original ÉTERNEL explorer, a contemplative traveler — no representation of deity. */
export function createExplorerAvatar(scene){
 const whole=new THREE.Group();whole.name='Voyageur ÉTERNEL';
 const torso=new THREE.Group(),clothParts=[];
 const ivory=new THREE.MeshStandardMaterial({color:'#f1e8d5',roughness:.83,side:THREE.DoubleSide});
 const sage=new THREE.MeshStandardMaterial({color:'#497568',roughness:.88,side:THREE.DoubleSide});
 const deep=new THREE.MeshStandardMaterial({color:'#203e39',roughness:.95,side:THREE.DoubleSide});
 const gold=new THREE.MeshStandardMaterial({color:'#d8b980',metalness:.55,roughness:.42});
 const darkFace=new THREE.MeshStandardMaterial({color:'#192d2c',roughness:1});
 const glass=new THREE.MeshBasicMaterial({color:'#ffe0a1',transparent:true,opacity:.9});
 const mk=(geo,mat,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);return m;};
 const profile=[
  [0,2.33],[.31,2.31],[.38,2.18],[.43,1.88],
  [.39,1.58],[.54,1.32],[.77,.39],[.90,.14]
 ].map(p=>new THREE.Vector2(p[0],p[1]));
 const robe=mk(new THREE.LatheGeometry(profile,24),sage);
 torso.add(robe);clothParts.push(robe);
 const stripe=mk(new THREE.TorusGeometry(.45,.035,6,30),gold,0,1.52,0);
 stripe.rotation.x=Math.PI/2;torso.add(stripe);
 // Hood silhouette: protected face stays dark, a traveler not an idol.
 const hood=mk(new THREE.SphereGeometry(.45,24,18,0,Math.PI*2,0,Math.PI*.92),ivory,0,2.33,0);
 hood.scale.set(1.02,1.23,.92);torso.add(hood);
 const face=mk(new THREE.SphereGeometry(.305,20,16),darkFace,0,2.32,-.21);
 face.scale.set(.96,.89,.45);torso.add(face);
 const cowl=mk(new THREE.TorusGeometry(.33,.085,8,24,Math.PI*1.05),gold,0,2.36,-.30);
 cowl.rotation.z=Math.PI*.96;torso.add(cowl);
 const scarf=mk(new THREE.ConeGeometry(.58,1.2,18,2,true),ivory,0,1.60,.21);
 scarf.rotation.x=-.10;torso.add(scarf);
 const legL=new THREE.Group(),legR=new THREE.Group();
 for(const [leg,side]of [[legL,-1],[legR,1]]){
  leg.position.set(side*.27,.53,0);
  const boot=mk(new THREE.CapsuleGeometry(.13,.45,4,7),deep,0,-.19,-.03);
  boot.rotation.x=.08;leg.add(boot);torso.add(leg);
 }
 const leftArm=new THREE.Group(),rightArm=new THREE.Group();
 for(const [arm,side]of [[leftArm,-1],[rightArm,1]]){
  arm.position.set(side*.45,1.93,0);
  const sleeve=mk(new THREE.ConeGeometry(.29,1.0,12,2),ivory,side*.03,-.36,0);
  sleeve.rotation.z=side*.15;arm.add(sleeve);torso.add(arm);
 }
 const lantern=new THREE.Group();lantern.position.set(.78,.95,-.25);
 const frame=mk(new THREE.CylinderGeometry(.18,.18,.28,8,1,true),gold);
 frame.position.y=-.15;lantern.add(frame);
 const inner=mk(new THREE.IcosahedronGeometry(.16,1),glass,0,-.14,0);lantern.add(inner);
 const wire=mk(new THREE.TorusGeometry(.16,.023,5,12),gold,0,.03,0);wire.rotation.x=Math.PI/2;lantern.add(wire);
 torso.add(lantern);
 // Two original wind-swept fabric strips behind the traveler.
 for(const side of [-1,1]){
  const g=new THREE.PlaneGeometry(.33,1.9,4,14);
  g.translate(side*.37,1.15,.39);
  const p=g.getAttribute('position');
  for(let i=0;i<p.count;i++){
   const y=p.getY(i);
   p.setZ(i,.35+Math.max(0,1.86-y)*.32);
  }
  g.computeVertexNormals();
  const m=mk(g,side===-1?ivory:sage);
  torso.add(m);clothParts.push(m);
 }
 whole.add(torso);
 scene.add(whole);
 const ring=new THREE.Mesh(
  new THREE.RingGeometry(.7,1.08,44),
  new THREE.MeshBasicMaterial({color:'#f1d391',transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide})
 );
 ring.rotation.x=-Math.PI/2;ring.position.y=.06;whole.add(ring);
 return {
  group:whole,
  update({x,y,z,yaw,moving,sprint,time}){
   whole.position.set(x,y,z);
   whole.rotation.y=yaw;
   const gait=moving?(sprint?12.2:8.3):0;
   const stride=moving?Math.sin(time*gait):0;
   torso.position.y=(moving?.018:0)+Math.sin(time*1.3)*.018;
   torso.rotation.z=THREE.MathUtils.lerp(torso.rotation.z,moving?Math.sin(time*gait)*.025:0,.09);
   legL.rotation.x=THREE.MathUtils.lerp(legL.rotation.x,stride*.35,.28);
   legR.rotation.x=THREE.MathUtils.lerp(legR.rotation.x,-stride*.35,.28);
   leftArm.rotation.x=THREE.MathUtils.lerp(leftArm.rotation.x,-stride*.17,.22);
   rightArm.rotation.x=THREE.MathUtils.lerp(rightArm.rotation.x,stride*.17,.22);
   scarf.rotation.x=.04+Math.sin(time*1.6)*.07+(moving?.12:0);
   lantern.position.y=.97+Math.sin(time*1.8)*.025;
   ring.material.opacity=.18+Math.sin(time*1.1)*.045;
  },
  show(v){whole.visible=v;},
  destroy(){scene.remove(whole);whole.traverse(o=>{if(o.isMesh)o.geometry.dispose();});}
 };
}
