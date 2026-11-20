import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * ÉTERNEL • Direction artistique des 7 biomes
 * La planche originale impose : vallées roses et or, cascades, arbres fleuris,
 * arches en pierre ivoire, eau réfléchissante et Arbre des Intercesseurs colossal.
 * 3D réelle. Les objets de prière continuent d'utiliser les données publiques
 * de main.js. Les éléments ici sont tous décoratifs.
 *
 * Assets GLB externes : CC0 1.0, 3DAssets.dev (CDN permanent CORS).
 * Pas de contenu d'utilisateur stocké dans ces ressources.
 */
const PI=Math.PI,TAU=PI*2;
const rnd0=(seed)=>{let x=(Math.abs(seed)|0)%2147483646+1;return()=>{x=(x*16807)%2147483647;return(x-1)/2147483646;}};
const clamp=(x,l,h)=>Math.min(h,Math.max(l,x));
function canvasTexture(painter,w=256,h=256){
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');painter(ctx,w,h);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 tex.anisotropy=2;return tex;
}
function makePetalTexture(){
 return canvasTexture((ctx,w,h)=>{
  const r=Math.random;ctx.clearRect(0,0,w,h);
  // Five distinct petals form a natural spring flower cluster.
  const gradient=ctx.createRadialGradient(128,126,6,128,126,100);
  gradient.addColorStop(0,'#fff9d4');
  gradient.addColorStop(.2,'#fff7ed');
  gradient.addColorStop(.55,'#f8b7ca');
  gradient.addColorStop(.85,'#e77a9b');
  gradient.addColorStop(1,'rgba(235,112,157,0)');
  for(let i=0;i<5;i++){
   const a=(i*2*PI)/5;
   ctx.save();ctx.translate(128+Math.cos(a)*24,126+Math.sin(a)*24);ctx.rotate(a-PI/2);
   ctx.fillStyle=gradient;ctx.beginPath();ctx.ellipse(0,-35,38,63,0,0,TAU);ctx.fill();
   ctx.restore();
  }
  ctx.beginPath();ctx.arc(128,126,17,0,TAU);
  ctx.fillStyle='#fff0a0';ctx.fill();
  for(let i=0;i<11;i++){
   const a=i*2*PI/11;
   ctx.fillStyle='#d4a753';ctx.beginPath();
   ctx.arc(128+Math.cos(a)*12,126+Math.sin(a)*12,2.6,0,TAU);ctx.fill();
  }
 },256,256);
}
function makeBarkTexture(){
 const r=rnd0(2259);
 return canvasTexture((ctx,w,h)=>{
   ctx.fillStyle='#7d604a';ctx.fillRect(0,0,w,h);
   for(let i=0;i<580;i++){
     const x=r()*w,y=r()*h,height=12+r()*115;
     ctx.lineWidth=.45+r()*3;
     ctx.strokeStyle=r()>.6?'rgba(237,209,164,.24)':'rgba(35,44,36,.27)';
     ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-2+r()*4,y+height*.4,x-6+r()*10,y+height*.7,x,y+height);
     ctx.stroke();
   }
   for(let i=0;i<100;i++){
     ctx.fillStyle='rgba(77,117,75,.15)';
     ctx.fillRect(r()*w,r()*h,2+r()*12,1+r()*17);
   }
 },256,512);
}
function makeFlowerCrownMaterial(texture,tint){
 return new THREE.MeshStandardMaterial({
  map:texture,color:tint,transparent:true,alphaTest:.17,side:THREE.DoubleSide,
  depthWrite:true,roughness:.95,metalness:0,
  emissive:new THREE.Color('#6b1e3d'),emissiveIntensity:.12
 });
}
const ASSETS=[
 ['strangler','https://cdn.3dassets.dev/assets/6816/v1/model.glb'],
 ['buttress','https://cdn.3dassets.dev/assets/6818/v1/model.glb'],
 ['almond','https://cdn.3dassets.dev/assets/6817/v1/model.glb'],
 ['fern','https://cdn.3dassets.dev/assets/6827/v1/model.glb'],
 ['bamboo','https://cdn.3dassets.dev/assets/6828/v1/model.glb'],
 ['bird','https://cdn.3dassets.dev/assets/6824/v1/model.glb'],
 ['ginger','https://cdn.3dassets.dev/assets/6826/v1/model.glb']
];
function makeArches(scene,terrain,x,z,span=13,count=4,step=8){
 const group=new THREE.Group();
 const stone=new THREE.MeshStandardMaterial({color:'#f4e9d8',roughness:.7,metalness:.04});
 const gild=new THREE.MeshStandardMaterial({color:'#e5c886',metalness:.48,roughness:.36});
 const trim=new THREE.MeshStandardMaterial({color:'#faf6ee',roughness:.55});
 for(let i=0;i<count;i++){
  const zz=z-i*step;
  const y=terrain(x,zz);
  const local=new THREE.Group();local.position.set(x,y,zz);
  for(let side of [-1,1]){
   const col=new THREE.Mesh(new THREE.CylinderGeometry(.53,.67,8.5,12),stone);
   col.position.set(side*span/2,4.25,0);local.add(col);
   const capital=new THREE.Mesh(new THREE.CylinderGeometry(.95,.87,.52,12),gild);
   capital.position.set(side*span/2,8.6,0);local.add(capital);
   const base=new THREE.Mesh(new THREE.CylinderGeometry(.86,.94,.5,12),trim);
   base.position.set(side*span/2,.25,0);local.add(base);
   const finial=new THREE.Mesh(new THREE.ConeGeometry(.55,1.85,8),gild);
   finial.position.set(side*span/2,10.4,0);local.add(finial);
  }
  const arch=new THREE.Mesh(new THREE.TorusGeometry(span/2,.62,8,45,PI),stone);
  arch.position.y=8.6;local.add(arch);
  const archTrim=new THREE.Mesh(new THREE.TorusGeometry(span/2+.58,.11,6,46,PI),gild);
  archTrim.position.y=8.6;local.add(archTrim);
  const capBeam=new THREE.Mesh(new THREE.BoxGeometry(span+2.3,.35,2),trim);
  capBeam.position.y=8.9+span/2;local.add(capBeam);
  for(let j=0;j<4;j++){
   const ornament=new THREE.Mesh(new THREE.IcosahedronGeometry(.15,1),gild);
   ornament.position.set((j-1.5)*span/4,11.7,1.15);local.add(ornament);
  }
  group.add(local);
 }
 const bridge=new THREE.Mesh(new THREE.BoxGeometry(span+5,.12,count*step+8),
 new THREE.MeshStandardMaterial({color:'#efe5d2',roughness:1}));
 bridge.position.set(x,terrain(x,z-step*(count-1)/2)+.03,z-step*(count-1)/2);
 // Avoid flattening an entire hillside under a big bridge; no bridge.
 scene.add(group);return group;
}
function flowerTree(scene,terrain,x,z,seed,scale=1,palette=0,detail=1,petalTexture,barkMat){
 const rnd=rnd0(seed);
 const g=new THREE.Group();g.position.set(x,terrain(x,z),z);
 const endpoints=[],geos=[];
 const h=(10+rnd()*4)*scale;
 const main=new THREE.CatmullRomCurve3([
   new THREE.Vector3(0,0,0),
   new THREE.Vector3(.20*scale,h*.26,0),
   new THREE.Vector3(-.24*scale,h*.64,.18*scale),
   new THREE.Vector3(0,h,0)
 ]);
 geos.push(new THREE.TubeGeometry(main,22,.65*scale,7,false));
 for(let i=0;i<25;i++){
  const a=i*2.39996,level=.39+rnd()*.54;
  const h0=h*level,extent=(3.2+rnd()*4.5)*scale;
  const p0=new THREE.Vector3((rnd()-.5)*.35*scale,h0,(rnd()-.5)*.35*scale);
  const p1=new THREE.Vector3(Math.cos(a)*extent*.47,h0+extent*.35,Math.sin(a)*extent*.47);
  const p2=new THREE.Vector3(Math.cos(a)*extent,h0+extent*(.42+rnd()*.16),Math.sin(a)*extent);
  geos.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0,p1,p2),12,(level>.78?.11:.20)*scale,5));
  endpoints.push(p2);
  for(let j=0;j<3;j++){
   const e=p2.clone().add(new THREE.Vector3((rnd()-.5)*4*scale,rnd()*2.8*scale,(rnd()-.5)*4*scale));
   geos.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p1,p1.clone().lerp(e,.55),e),6,.055*scale,4));
   endpoints.push(e);
  }
 }
 const merged=mergeGeometries(geos,false);
 if(merged)g.add(new THREE.Mesh(merged,barkMat));
 geos.forEach(v=>v.dispose());
 const count=Math.floor(detail*(650+rnd()*240)),petalGeom=new THREE.PlaneGeometry(.93*scale,.93*scale);
 const mat=makeFlowerCrownMaterial(petalTexture,
   palette===0?'#ffe1e5':palette===1?'#f7c2d5':palette===2?'#fff8e6':'#e5c6fc');
 const petals=new THREE.InstancedMesh(petalGeom,mat,count);
 const dummy=new THREE.Object3D(),c=new THREE.Color();
 for(let i=0;i<count;i++){
  const p=endpoints[(rnd()*endpoints.length)|0],off=(1.3+rnd()*1.4)*scale;
  dummy.position.set(p.x+(rnd()-.5)*off*2,p.y+(rnd()-.5)*off*1.5,p.z+(rnd()-.5)*off*2);
  dummy.rotation.set(rnd()*PI,rnd()*TAU,rnd()*PI);
  const sc=.45+rnd()*.9;dummy.scale.setScalar(sc);dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix);
  const hue=palette===3?.76:.90; c.setHSL(hue+rnd()*.08,.33+rnd()*.24,.75+rnd()*.18);
  petals.setColorAt(i,c);
 }
 petals.instanceMatrix.needsUpdate=true;petals.frustumCulled=false;g.add(petals);
 // A hand-sculpted, freestanding silhouette with multiple organic limb structures.
 g.userData.eternelBloom=true;scene.add(g);return g;
}
function monumentTree(scene,terrain,x,z,barkMat,petalTex,mobile){
 const rnd=rnd0(2040),g=new THREE.Group();
 g.position.set(x,terrain(x,z),z);
 const wood=[],tips=[],height=71;
 const core=new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,0,0),new THREE.Vector3(1.1,18,0),
  new THREE.Vector3(-1.6,42,1),new THREE.Vector3(1.1,58,-1),
  new THREE.Vector3(0,71,0)
 ]);
 wood.push(new THREE.TubeGeometry(core,42,4.2,12,false));
 for(let i=0;i<36;i++){
  const a=i*2.39996,level=.38+rnd()*.54,h=height*level;
  const length=13+rnd()*19;
  const start=new THREE.Vector3((rnd()-.5)*3,h,(rnd()-.5)*2);
  const mid=new THREE.Vector3(Math.cos(a)*length*.48,h+length*.37,Math.sin(a)*length*.48);
  const end=new THREE.Vector3(Math.cos(a)*length,h+length*(.37+rnd()*.28),Math.sin(a)*length);
  const bezier=new THREE.QuadraticBezierCurve3(start,mid,end);
  wood.push(new THREE.TubeGeometry(bezier,14,.40+rnd()*.7,7,false));
  tips.push(end);
  for(let j=0;j<5;j++){
   const p=bezier.getPoint(.42+j*.10);
   const q=p.clone().add(new THREE.Vector3((rnd()-.5)*12,rnd()*8,(rnd()-.5)*12));
   wood.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p,p.clone().lerp(q,.5).add(new THREE.Vector3(0,2,0)),q),8,.09+rnd()*.2,5));
   tips.push(q);
  }
 }
 for(let i=0;i<16;i++){
  const a=i*TAU/16,dir=new THREE.Vector3(Math.cos(a),0,Math.sin(a));
  const start=dir.clone().multiplyScalar(3.1);start.y=1.2;
  const mid=dir.clone().multiplyScalar(8);mid.y=1.8;
  const end=dir.clone().multiplyScalar(17+rnd()*7);end.y=.22;
  wood.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(start,mid,end),12,.34+rnd()*.34,6));
 }
 const trunk=mergeGeometries(wood,false);
 if(trunk)g.add(new THREE.Mesh(trunk,barkMat));
 wood.forEach(geometry=>geometry.dispose());
 const n=mobile?10000:21000,blossoms=new THREE.InstancedMesh(
  new THREE.PlaneGeometry(1.45,1.45),
  makeFlowerCrownMaterial(petalTex,'#ffeddd'),n);
 const o=new THREE.Object3D(),clr=new THREE.Color();
 for(let i=0;i<n;i++){
  const anchor=tips[Math.floor(rnd()*tips.length)];
  const rad=2.8+rnd()*5.5;
  o.position.set(anchor.x+(rnd()-.5)*rad*2,anchor.y+(rnd()-.5)*rad*1.45,anchor.z+(rnd()-.5)*rad*2);
  o.rotation.set(rnd()*PI,rnd()*TAU,rnd()*PI);
  o.scale.setScalar(.55+rnd()*1.25);o.updateMatrix();blossoms.setMatrixAt(i,o.matrix);
  clr.setHSL(rnd()>.45?.91:.12,.33+rnd()*.19,.72+rnd()*.18);
  blossoms.setColorAt(i,clr);
 }
 blossoms.instanceMatrix.needsUpdate=true;blossoms.frustumCulled=false;g.add(blossoms);
 const lanternGold=new THREE.MeshStandardMaterial({color:'#efca86',metalness:.62,roughness:.28});
 const lit=new THREE.MeshBasicMaterial({color:'#ffe4a2'});
 const lanterns=new THREE.Group();
 for(let i=0;i<(mobile?42:82);i++){
  const a=tips[Math.floor(rnd()*tips.length)];
  const center=new THREE.Vector3(a.x+(rnd()-.5)*9,a.y-1-rnd()*8,a.z+(rnd()-.5)*9);
  const chain=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.3+rnd()*2.1,4),lanternGold);
  chain.position.copy(center).add(new THREE.Vector3(0,1.4,0));lanterns.add(chain);
  const c=new THREE.Mesh(new THREE.IcosahedronGeometry(.28+rnd()*.2,1),lit);
  c.position.copy(center);lanterns.add(c);
 }
 g.add(lanterns);scene.add(g);return g;
}
function scenicWater(scene,terrain,x,z,radius,mobile){
 const geometry=new THREE.CircleGeometry(radius,80);
 const plane=new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial({
  color:'#75bfbd',metalness:.28,roughness:.08,clearcoat:1,clearcoatRoughness:.05,
  transparent:true,opacity:.84,side:THREE.DoubleSide,depthWrite:false
 }));
 plane.rotation.x=-PI/2;
 plane.position.set(x,terrain(x,z)+.30,z);
 plane.scale.set(1,1.12,1);
 scene.add(plane);
 const rings=[];
 const mat=new THREE.MeshBasicMaterial({color:'#edfff5',transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide});
 for(let i=0;i<(mobile?8:17);i++){
  const ring=new THREE.Mesh(new THREE.RingGeometry(.5+i*.8,.54+i*.8,80),mat.clone());
  ring.rotation.x=-PI/2;ring.position.copy(plane.position).add(new THREE.Vector3(0,.035,0));rings.push(ring);scene.add(ring);
 }
 return {plane,rings};
}
function stairway(scene,terrain,x,z,count=24,direction=-1){
 const stone=new THREE.MeshStandardMaterial({color:'#eee3cf',roughness:.92});
 const gold=new THREE.MeshStandardMaterial({color:'#d4b479',metalness:.34,roughness:.48});
 const gp=new THREE.Group();
 for(let i=0;i<count;i++){
  const zz=z+i*direction*1.75,xx=x+Math.sin(i*.14)*2.7,yy=terrain(xx,zz);
  const step=new THREE.Mesh(new THREE.BoxGeometry(5.3,.24,1.48),stone);
  step.position.set(xx,yy+.1,zz);step.rotation.y=.10*Math.sin(i*.17);gp.add(step);
  if(i%4===0)for(let sign of [-1,1]){
   const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,1.1,8),gold);
   pedestal.position.set(xx+sign*3,yy+.55,zz);gp.add(pedestal);
   const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.24,1),new THREE.MeshBasicMaterial({color:'#ffe3a8'}));
   orb.position.set(xx+sign*3,yy+1.22,zz);gp.add(orb);
  }
 }
 scene.add(gp);return gp;
}
function stagedMeshes({scene,biomes,heightAt,mobile,onStatus}){
 const loader=new GLTFLoader();
 const groups=[],assetsLoaded=[],failed=[];
 const placements=[
  {kind:'strangler',spots:[[-24,166,2.1],[-19,150,2.1],[36,157,1.9],[41,76,2.6],[-15,41,2.4],[-101,-25,2.1],[-145,-36,2.1]]},
  {kind:'buttress',spots:[[-41,155,2.2],[58,119,1.8],[14,56,2.8],[-51,-11,2.8],[-166,-35,2.5],[-121,-95,2.2]]},
  {kind:'almond',spots:[[-55,85,2.7],[75,65,2.4],[-41,-89,2.5],[145,-17,2.0],[-102,-48,2.1]]},
  {kind:'fern',spots:[[-9,177,2.3],[24,176,2.6],[4,119,3],[-23,96,2.6],[48,57,2.7],[-120,-60,3],[123,-48,2.7]]},
  {kind:'bird',spots:[[-11,183,2.5],[17,189,2.3],[35,92,2.5],[83,40,2.8],[132,-44,2.4]]},
  {kind:'ginger',spots:[[-26,186,2.4],[27,152,2.1],[12,111,2.3],[41,11,2.5],[-130,-47,2.6]]},
  {kind:'bamboo',spots:[[55,150,2.5],[82,99,2.8],[-89,32,2.2],[-172,-59,2.0]]}
 ];
 const sourceByKind=Object.fromEntries(ASSETS);
 async function loadOne(entry){
  const url=sourceByKind[entry.kind];if(!url)return;
  try{
    const gltf=await loader.loadAsync(url);
    const model=gltf.scene;model.traverse(o=>{
      if(o.isMesh){
        o.castShadow=false;
        o.receiveShadow=true;
        const materials=Array.isArray(o.material)?o.material:[o.material];
        materials.forEach(m=>{if(m){m.side=THREE.DoubleSide;m.needsUpdate=true;}});
      }
    });
    const group=new THREE.Group();group.name='3DAssets-CC0-'+entry.kind;
    for(const [x,z,s] of entry.spots){
      const item=model.clone(true);
      const bbox=new THREE.Box3().setFromObject(item);
      const min=bbox.min.y;
      item.scale.setScalar(s);
      item.position.set(x,heightAt(x,z)-min*s,z);
      item.rotation.y=((x*73+z*13)%360)*PI/180;
      group.add(item);
    }
    scene.add(group);groups.push(group);assetsLoaded.push(entry.kind);
    onStatus?.(assetsLoaded.length,placements.length);
  }catch(error){failed.push(entry.kind);console.warn('GLB '+entry.kind,error);}
 }
 // limit concurrency; on mobile prefer fewer kinds to keep draw calls and memory safe.
 const queue=mobile?placements.filter(p=>!['almond','bamboo'].includes(p.kind)):placements;
 let current=0;
 async function worker(){
  while(current<queue.length){const target=queue[current++];await loadOne(target);}
 }
 void Promise.all([worker(),worker()]).then(()=>onStatus?.(assetsLoaded.length,queue.length));
 return {groups,assetsLoaded,failed};
}
export function buildReferenceWorld({scene,biomes,heightAt,mobile,onStatus=()=>{}}){
 const rnd=rnd0(74016),created=[],petalTexture=makePetalTexture(),barkTexture=makeBarkTexture();
 barkTexture.wrapS=THREE.RepeatWrapping;barkTexture.wrapT=THREE.RepeatWrapping;barkTexture.repeat.set(2,4);
 const bark=new THREE.MeshStandardMaterial({map:barkTexture,color:'#b09a79',roughness:.98});
 // Exact spatial staging inspired by the user's 7-biome visual reference:
 // pink flowering trees framing ivory arches, flowers, water, then sacred tree on horizon.
 const accentTrees=[
  [-28,195,1.55,0], [37,196,1.36,1],[-43,158,1.48,0],[46,145,1.35,2],
  [-29,119,1.2,1],[28,105,1.35,0],
  [-24,37,1.56,0],[66,14,1.37,1],[31,-14,1.62,2],
  [-155,-39,1.16,3],[-114,-32,1.45,3],
  [121,-47,1.33,0],[165,-31,1.4,1],[185,-72,1.2,2],
  [138,-172,1.2,2],[169,-160,1.13,1],
  [-48,-225,1.4,0]
 ];
 let flowerCursor=0;function createBlossoms(){
  const limit=mobile?2:3;
  for(let n=0;n<limit&&flowerCursor<accentTrees.length;n++,flowerCursor++){
   const [x,z,sc,palette]=accentTrees[flowerCursor];
   created.push(flowerTree(scene,heightAt,x,z,700+flowerCursor*17,sc,palette,mobile?.53:.86,petalTexture,bark));
  }
  if(flowerCursor<accentTrees.length)setTimeout(createBlossoms,mobile?300:180);
 }
 setTimeout(createBlossoms,650);
 // Monument at -12,-35: the old tree remains available as fallback, but the sculpted
 // 70m+ tree is the new visual center and carries luminous decorative lanterns.
 setTimeout(()=>{
  try{created.push(monumentTree(scene,heightAt,-12,-35,bark,petalTexture,mobile));}
  catch(error){console.error('Arbre monumental',error);}
 },mobile?2200:1300);
 setTimeout(()=>{
   try{
    created.push(makeArches(scene,heightAt,8,143,12,4,8));
    created.push(makeArches(scene,heightAt,39,3,10,3,7));
    created.push(makeArches(scene,heightAt,141,-160,12,3,6));
    created.push(stairway(scene,heightAt,4,185,26,-1));
    created.push(stairway(scene,heightAt,-15,-5,23,-1));
   }catch(error){console.error('Architecture',error);}
 },mobile?1250:550);
 const pools=[];
 setTimeout(()=>{
   try{
    pools.push(scenicWater(scene,heightAt,56,111,21,mobile));
    pools.push(scenicWater(scene,heightAt,17,-37,21,mobile));
    pools.push(scenicWater(scene,heightAt,143,-42,19,mobile));
   }catch(error){console.error('Bassins',error);}
 },mobile?1750:950);
 const realAssets=stagedMeshes({scene,biomes,heightAt,mobile,onStatus});
 let time=0;
 return {
  realAssets,created,
  update(now){
   if(now-time<90)return;time=now;
   for(let j=0;j<pools.length;j++){
    const pond=pools[j];
    pond.rings.forEach((ring,i)=>{
      const s=(i*.065+now*.000055)%1;
      ring.scale.setScalar(.46+s*.95);
      ring.material.opacity=.16*(1-s);
    });
   }
  },
  destroy(){
    for(const g of created)scene.remove(g);
    for(const gp of realAssets.groups)scene.remove(gp);
    for(const pool of pools){scene.remove(pool.plane);pool.rings.forEach(r=>scene.remove(r));}
    petalTexture.dispose();barkTexture.dispose();bark.dispose();
  }
 };
}
