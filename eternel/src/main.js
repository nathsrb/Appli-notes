import * as THREE from 'three';
import {createEternalRealm} from './world-expansion.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import '../style.css';
const ROOT=document.getElementById('root'),canvas=document.getElementById('scene');
const el=id=>document.getElementById(id);
const setText=(id,v)=>{const n=el(id);if(n)n.textContent=v;};
const show=(id,b=true)=>{const n=el(id);if(n)n.hidden=!b;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const golden=2.399963229728653;
const biomes=[
 {id:'aube',name:"La Vallée de l'Aube",caption:"Là où commence le voyage",x:5,z:145,color:0x9dbd78,description:"Une vallée baignée par le soleil du matin, de grandes cascades et un chemin qui mène au cœur du jardin."},
 {id:'central',name:'Le Jardin central',caption:'Le paradis végétal',x:45,z:40,color:0x79ad74,description:"Une abondance de plantes, ruisseaux, fleurs et arbres où les intentions publiques deviennent des lumières."},
 {id:'arbre',name:"L'Arbre des Intercesseurs",caption:'Le cœur vivant du monde',x:-12,z:-35,color:0xc2ba84,description:"Un sanctuaire végétal. Les lumières de cet arbre représentent des intentions de prière réellement publiées."},
 {id:'alliances',name:'La Forêt des Alliances',caption:"Les chemins de l'intercession",x:-132,z:-54,color:0x52785d,description:"Une forêt ancienne et lumineuse, symbole des liens entre intercesseurs. Les alliances personnelles restent confidentielles."},
 {id:'temoignages',name:'Le Jardin des Témoignages',caption:'La vallée de la reconnaissance',x:143,z:-45,color:0xc98faa,description:"Des fleurs à perte de vue. Seuls les témoignages effectivement déclarés exaucés apparaissent comme récits interactifs."},
 {id:'mont',name:'Le Mont de la Présence',caption:'Le lieu du recueillement',x:-30,z:-245,color:0xcad8d7,description:"Un chemin à travers les montagnes, vers un lieu de silence et un carnet personnel accessible depuis votre compte."},
 {id:'parole',name:'La Maison de la Parole',caption:"Le lieu d'apprentissage",x:153,z:-167,color:0xd3bea5,description:"Une architecture de pierre claire pour la lecture et les futures formations, encore en préparation."}
];
const ordinary=biomes.filter(b=>b.id!=='arbre');
const speedNormal=13,camHeight=3.15;
const rand=(seed)=>{seed=(Math.abs(Math.floor(seed))%2147483646)+1;return ()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};};
const rnd=rand(492719),q=new THREE.Quaternion(),o=new THREE.Object3D(),c=new THREE.Color();
const mobile=matchMedia('(pointer:coarse)').matches;
const quality=mobile?'balanced':'high';
const frameCap=quality==='high'?1.7:1.2;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa3c7b7);scene.fog=new THREE.FogExp2(0xaacbb5,.0032);
const camera=new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,.12,700);
let renderer;
try{
 renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:!mobile,powerPreference:mobile?'low-power':'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.43;
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,frameCap));
 renderer.setSize(innerWidth,innerHeight,false);
}catch(error){console.error(error);show('loader',false);show('error',true);throw error;}
scene.add(new THREE.HemisphereLight(0xfff9dd,0x527c70,2.95));
const sun=new THREE.DirectionalLight(0xffe3ab,3.1);sun.position.set(-120,150,-210);scene.add(sun);
const soft=new THREE.DirectionalLight(0x93bbc7,.67);soft.position.set(80,55,80);scene.add(soft);
const glow=(x,y,z,r,color,alpha=.36)=>{
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),new THREE.MeshBasicMaterial({color,transparent:true,opacity:alpha,depthWrite:false,blending:THREE.AdditiveBlending}));
 mesh.position.set(x,y,z);scene.add(mesh);return mesh;
};
glow(-170,153,-350,28,0xffd99b,.45);
const skyGeo=new THREE.SphereGeometry(620,32,18);
const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x729baf)},horizon:{value:new THREE.Color(0xe7d9b2)},bottom:{value:new THREE.Color(0xaacabe)}},vertexShader:'varying vec3 vWorld; void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:'uniform vec3 top;uniform vec3 horizon;uniform vec3 bottom;varying vec3 vWorld;void main(){float h=normalize(vWorld).y;vec3 col=mix(bottom,horizon,smoothstep(-.12,.15,h));col=mix(col,top,smoothstep(.12,.84,h));gl_FragColor=vec4(col,1.);}'});
const sky=new THREE.Mesh(skyGeo,skyMat);scene.add(sky);
const v3=(x,y,z)=>new THREE.Vector3(x,y,z);
const distance=(x,z,p)=>Math.hypot(x-p.x,z-p.z);
const heightAt=(x,z)=>{
 const hills=.5*Math.sin(x*.045)*Math.cos(z*.05)+.38*Math.sin(x*.12+z*.07);
 const ridge=Math.max(0,(-z-185)/120);
 const mount=Math.max(0,1-Math.abs(x+29)/140);
 return hills + ridge*ridge*23*mount;
};
function createFloor(){
 const g=new THREE.PlaneGeometry(720,760,145,150);g.rotateX(-Math.PI/2);g.translate(0,0,-35);
 const p=g.attributes.position,colors=[];
 const base=new THREE.Color();
 for(let i=0;i<p.count;i++){
   const x=p.getX(i),z=p.getZ(i),y=heightAt(x,z);p.setY(i,y);
   let nearest=biomes[0],dist=99999;
   for(const b of biomes){const d=distance(x,z,b);if(d<dist){nearest=b;dist=d;}}
   base.setHex(nearest.color);
   const shade=.87+Math.sin(x*.085+z*.042)*.07+Math.sin(z*.14-x*.12)*.055;
   base.multiplyScalar(shade);
   colors.push(base.r,base.g,base.b);
 }
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
 scene.add(m);
}createFloor();
function ribbon(from,to,width,mat,steps=45){
 const arr=[],idx=[];
 for(let i=0;i<=steps;i++){
   const t=i/steps;const x=from.x+(to.x-from.x)*t+Math.sin(t*Math.PI*3)*2.8;
   const z=from.z+(to.z-from.z)*t+Math.sin(t*Math.PI*2)*3.5;
   const y=heightAt(x,z)+.08;
   const ahead=from.clone().lerp(to,Math.min(1,t+.008)).sub(from.clone().lerp(to,Math.max(0,t-.008))).normalize();
   arr.push(x+ahead.z*width/2,y,z-ahead.x*width/2,x-ahead.z*width/2,y,z+ahead.x*width/2);
   if(i<steps){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));g.setIndex(idx);g.computeVertexNormals();
 const mesh=new THREE.Mesh(g,mat);scene.add(mesh);return mesh;
}
const pathMat=new THREE.MeshStandardMaterial({color:0xe7dac0,roughness:.95,side:THREE.DoubleSide});
[
 [biomes[0],biomes[1]],[biomes[1],biomes[2]],[biomes[2],biomes[3]],
 [biomes[2],biomes[4]],[biomes[2],biomes[5]],[biomes[4],biomes[6]],[biomes[5],biomes[6]]
].forEach(([a,b])=>ribbon(v3(a.x,0,a.z),v3(b.x,0,b.z),4.6,pathMat));
const riverMat=new THREE.MeshPhysicalMaterial({color:0x73c6c6,metalness:.15,roughness:.17,transparent:true,opacity:.91,side:THREE.DoubleSide});
for(const spec of [
 [{x:68,z:215},{x:58,z:78},12],
 [{x:58,z:78},{x:97,z:-65},9],
 [{x:-170,z:60},{x:-96,z:-100},5]
])ribbon(v3(spec[0].x,0,spec[0].z),v3(spec[1].x,0,spec[1].z),spec[2],riverMat,70);
const waterEdges=[];
const whiteFoam=new THREE.MeshBasicMaterial({color:0xe7fcfa,transparent:true,opacity:.55,side:THREE.DoubleSide});
for(let i=0;i<26;i++){
 const t=i/25,z=210-t*140,x=68+(58-68)*t+Math.sin(t*9)*2;
 const m=new THREE.Mesh(new THREE.PlaneGeometry(1.5+rnd()*3,.08),whiteFoam);
 m.rotation.x=-Math.PI/2;m.rotation.z=rnd()*Math.PI;m.position.set(x,heightAt(x,z)+.13,z);scene.add(m);waterEdges.push(m);
}
const makeSphere=(x,y,z,rx,ry,rz,color)=>{const g=new THREE.SphereGeometry(1,12,9);g.scale(rx,ry,rz);const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:1}));m.position.set(x,y,z);scene.add(m);return m;};
const rockGeo=new THREE.DodecahedronGeometry(1,1);
const rockColors=[0xa1b29d,0xc0c6a8,0x899f90,0xb7bda9];
for(let i=0;i<270;i++){
 const x=(rnd()-.5)*570,z=(rnd()-.5)*610-28;
 if(Math.abs(x)>315||Math.abs(z)>360)continue;
 const size=.5+rnd()*3.7;const m=new THREE.Mesh(rockGeo,new THREE.MeshStandardMaterial({color:rockColors[Math.floor(rnd()*rockColors.length)],flatShading:true,roughness:1}));
 m.position.set(x,heightAt(x,z)+size*.12,z);m.scale.set(size,size*(.42+rnd()*.6),size*.9);m.rotation.set(rnd(),rnd()*3,rnd());scene.add(m);
}
function leafTexture(){
 const cv=document.createElement('canvas');cv.width=64;cv.height=128;
 const ctx=cv.getContext('2d'),g=ctx.createLinearGradient(16,0,48,128);
 g.addColorStop(0,'#f6ffdb');g.addColorStop(.4,'#a5d391');g.addColorStop(1,'#477f60');
 ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(30,125);ctx.bezierCurveTo(-4,75,9,25,29,4);ctx.bezierCurveTo(59,35,70,75,30,125);ctx.fill();
 ctx.strokeStyle='rgba(255,255,218,.58)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(30,117);ctx.quadraticCurveTo(36,68,29,12);ctx.stroke();
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const leafTex=leafTexture();
const leafGeo=new THREE.PlaneGeometry(1,1.75);
const trunkMat=new THREE.MeshStandardMaterial({color:0x8d826a,roughness:1});
const leafMats=new Map();
function materialLeaves(variant){
 if(leafMats.has(variant))return leafMats.get(variant);
 const tint=['#f3f8e3','#dff5d3','#fbe0e5','#bce9ba','#eedfb2'][variant%5];
 const mat=new THREE.MeshStandardMaterial({map:leafTex,color:tint,transparent:true,alphaTest:.3,side:THREE.DoubleSide,roughness:.85});
 leafMats.set(variant,mat);return mat;
}
const forestTrees=[];
function tree(x,z,scale,seed,variant=0,hero=false){
 const rr=rand(seed),group=new THREE.Group();group.position.set(x,heightAt(x,z),z);scene.add(group);
 const limbGeos=[],rootGeos=[],leaves=[],stem=hero?33:14;
 const trunkCurve=new THREE.CatmullRomCurve3([
   v3(0,0,0),v3(.3*scale,stem*.27*scale,0),
   v3(-.23*scale,stem*.62*scale,.5*scale),v3(.3*scale,stem*scale,0)
 ]);
 limbGeos.push(new THREE.TubeGeometry(trunkCurve,23,(hero?2.5:.73)*scale,8));
 const branchCount=hero?29:11;
 for(let i=0;i<branchCount;i++){
   const a=i*golden+rr()*.3,lo=stem*(hero?.38:.48)*scale+rr()*stem*.52*scale;
   const len=(hero?12:6)*scale*(.7+rr()*.6);
   const d=v3(Math.cos(a),0,Math.sin(a));
   const st=v3((rr()-.5)*.4*scale,lo,0);
   const en=v3(d.x*len,lo+len*(.25+rr()*.35),d.z*len);
   const mid=st.clone().lerp(en,.48).add(v3(0,2*scale,0));
   const path=new THREE.QuadraticBezierCurve3(st,mid,en);
   limbGeos.push(new THREE.TubeGeometry(path,13,(hero?.46:.20)*scale,6));
   leaves.push(en);
   for(let j=0;j<(hero?4:3);j++){
     const p=path.getPoint(.45+j*.12);
     const tip=p.clone().add(v3(d.x*(1+rr()*2.7)*scale,(1+rr()*3)*scale,d.z*(1+rr()*2.7)*scale));
     const curve=new THREE.QuadraticBezierCurve3(p,p.clone().lerp(tip,.5).add(v3(0,.8*scale,0)),tip);
     limbGeos.push(new THREE.TubeGeometry(curve,7,(hero?.11:.08)*scale,5));
     leaves.push(tip);
   }
 }
 for(let i=0;i<(hero?12:4);i++){
   const a=i*2*Math.PI/(hero?12:4),end=v3(Math.cos(a)*5.6*scale,.12,Math.sin(a)*5.6*scale);
   rootGeos.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(v3(Math.cos(a)*.8*scale,.1,0),v3(Math.cos(a)*3*scale,.55,Math.sin(a)*3*scale),end),12,(hero?.5:.25)*scale,7));
 }
 const merged=mergeGeometries([...limbGeos,...rootGeos],false);
 if(merged)group.add(new THREE.Mesh(merged,trunkMat));
 [...limbGeos,...rootGeos].forEach(g=>g.dispose());
 const count=hero?(mobile?3100:5100):(mobile?180:270);
 const inst=new THREE.InstancedMesh(leafGeo,materialLeaves(variant),count);
 for(let i=0;i<count;i++){
   const p=leaves[Math.floor(rr()*leaves.length)];
   const radius=(hero?5.3:3.1)*scale;
   o.position.set(p.x+(rr()-.5)*radius*1.8,p.y+(rr()-.5)*radius*1.12,p.z+(rr()-.5)*radius*1.8);
   o.rotation.set(rr()*3,rr()*6.28,rr()*3);
   const sc=(.35+rr()*.8)*scale*(hero?1.9:1.1);
   o.scale.setScalar(sc);o.updateMatrix();inst.setMatrixAt(i,o.matrix);
   c.setHSL((variant===2?.93:variant===4?.16:.27)+rr()*.085,.22+rr()*.17,.59+rr()*.20);inst.setColorAt(i,c);
 }
 inst.instanceMatrix.needsUpdate=true;inst.frustumCulled=false;group.add(inst);
 if(hero)group.userData.hero=true;
 forestTrees.push({group,x,z,scale,hero});
 return group;
}
tree(-12,-35,1.45,2091,4,true);
const forestRnd=rand(829);
for(const b of biomes){
 const counts={aube:15,central:21,arbre:20,alliances:27,temoignages:15,mont:14,parole:11};
 for(let i=0;i<counts[b.id];i++){
   const a=forestRnd()*Math.PI*2,r=16+forestRnd()*76;
   const x=b.x+Math.cos(a)*r,z=b.z+Math.sin(a)*r;
   if(Math.hypot(x+12,z+35)<22||Math.hypot(x-b.x,z-b.z)<8||Math.hypot(x-68,z-180)<11)continue;
   if(Math.abs(x)>290||Math.abs(z)>310)continue;
   const s=(b.id==='alliances'?1.1:1)*(0.6+forestRnd()*.55);
   tree(x,z,s,1000+i*37+Math.floor(b.x*117+8000),b.id==='temoignages'?2:b.id==='alliances'?3:b.id==='mont'?4:Math.floor(forestRnd()*4));
 }
}
const flowerTexture=()=>{
 const cv=document.createElement('canvas');cv.width=64;cv.height=64;const ctx=cv.getContext('2d');
 const grad=ctx.createRadialGradient(32,32,4,32,32,32);
 grad.addColorStop(0,'#fffde8');grad.addColorStop(.3,'#ffe0db');grad.addColorStop(.7,'#f4a7bd');grad.addColorStop(1,'rgba(255,179,218,0)');
 ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
};
const flowerTex=flowerTexture();
const flowerMat=new THREE.MeshBasicMaterial({map:flowerTex,transparent:true,depthWrite:false,side:THREE.DoubleSide});
const grassMat=new THREE.MeshStandardMaterial({color:0xa6c48b,roughness:1,side:THREE.DoubleSide});
const grasses=new THREE.InstancedMesh(new THREE.PlaneGeometry(.16,1.35),grassMat,mobile?4800:9000);
const blossoms=new THREE.InstancedMesh(new THREE.PlaneGeometry(1.25,1.25),flowerMat,mobile?2500:4800);
for(let i=0;i<grasses.count;i++){
 const b=biomes[Math.floor(rnd()*biomes.length)];
 const x=b.x+(rnd()-.5)*160,z=b.z+(rnd()-.5)*145;
 o.position.set(x,heightAt(x,z)+.5,z);o.rotation.set(0,rnd()*6.28,rnd()*.15);
 o.scale.setScalar(.4+rnd()*1.3);o.updateMatrix();grasses.setMatrixAt(i,o.matrix);
 c.setHSL(.22+rnd()*.18,.22+rnd()*.25,.46+rnd()*.23);grasses.setColorAt(i,c);
}
for(let i=0;i<blossoms.count;i++){
 const b=rnd()<.47?biomes[4]:biomes[Math.floor(rnd()*biomes.length)];
 const x=b.x+(rnd()-.5)*157,z=b.z+(rnd()-.5)*139;
 o.position.set(x,heightAt(x,z)+.7+rnd()*.7,z);o.rotation.set(rnd()*3,rnd()*6.28,rnd());
 o.scale.setScalar(.5+rnd()*1.5);o.updateMatrix();blossoms.setMatrixAt(i,o.matrix);
 c.setHSL(b.id==='temoignages'?.89+rnd()*.1:.05+rnd()*.37,.30+rnd()*.22,.74+rnd()*.15);blossoms.setColorAt(i,c);
}
grasses.instanceMatrix.needsUpdate=true;blossoms.instanceMatrix.needsUpdate=true;grasses.frustumCulled=false;blossoms.frustumCulled=false;
scene.add(grasses,blossoms);
const createParticles=()=>{
 const count=mobile?1000:2600,arr=new Float32Array(count*3);
 for(let i=0;i<count;i++){arr[i*3]=(rnd()-.5)*390;arr[i*3+1]=1.8+rnd()*42;arr[i*3+2]=(rnd()-.5)*470-28;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));
 const m=new THREE.PointsMaterial({color:0xffe8a8,size:mobile?.32:.42,transparent:true,opacity:.62,depthWrite:false,blending:THREE.AdditiveBlending});
 const p=new THREE.Points(g,m);scene.add(p);return p;
};
const motes=createParticles();
function mountain(x,z,r,h,seed){
 const rr=rand(seed),arr=[],colors=[],idx=[],size=12,levels=5;
 for(let j=0;j<levels;j++){
  const k=j/(levels-1);
  for(let i=0;i<size;i++){
   const a=i*2*Math.PI/size;
   const radius=r*(1-k*.94)*(.8+rr()*.36);
   const xx=x+Math.cos(a)*radius,zz=z+Math.sin(a)*radius,yy=heightAt(x,z)+k*h+(rr()-.5)*h*.06*(1-k);
   arr.push(xx,yy,zz);c.setHSL(.42,.12,.44+k*.35);colors.push(c.r,c.g,c.b);
  }
 }
 for(let j=0;j<levels-1;j++)for(let i=0;i<size;i++){const a=j*size+i,b=j*size+(i+1)%size,d=(j+1)*size+i,e=(j+1)*size+(i+1)%size;idx.push(a,b,d,b,e,d);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();
 const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1}));scene.add(mesh);
}
for(let i=0;i<11;i++)mountain((i-5)*58,-425-(i%3)*22,45+rnd()*19,70+rnd()*120,310+i);
for(let i=0;i<6;i++)mountain(-30+(i-3)*44,-292-i*17,20+rnd()*10,35+rnd()*44,920+i);
const marble=new THREE.MeshStandardMaterial({color:0xece5d2,roughness:.78});
const goldMat=new THREE.MeshStandardMaterial({color:0xd6ba7f,metalness:.45,roughness:.35});
function pillar(x,y,z,height=13){
 const g=new THREE.Group();const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.6,.75,height,14),marble);shaft.position.y=height/2;g.add(shaft);
 for(const top of [0,height]){
   const ring=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,.45,16),goldMat);ring.position.y=top;g.add(ring);
 }
 g.position.set(x,y,z);scene.add(g);
}
function arch(x,y,z,w,h){
 pillar(x-w/2,y,z,h);pillar(x+w/2,y,z,h);
 const beam=new THREE.Mesh(new THREE.BoxGeometry(w+2,.95,1.9),marble);beam.position.set(x,y+h+.6,z);scene.add(beam);
 const fin=new THREE.Mesh(new THREE.BoxGeometry(w+3,.25,2.4),goldMat);fin.position.set(x,y+h+1.3,z);scene.add(fin);
}
arch(-31,heightAt(-31,-252)+.1,-252,14,14);
arch(147,heightAt(147,-168)+.2,-168,16,15);
for(let i=0;i<2;i++)arch(-137+(i*6),heightAt(-137,-58),-58-i*12,12,12);
const house=new THREE.Group();
const houseBase=new THREE.Mesh(new THREE.CylinderGeometry(14,16,13,10),marble);houseBase.position.y=7;house.add(houseBase);
const houseDome=new THREE.Mesh(new THREE.SphereGeometry(14,30,18,0,Math.PI*2,0,Math.PI/2),marble);houseDome.position.y=13.4;house.add(houseDome);
const houseGold=new THREE.Mesh(new THREE.TorusGeometry(14,.25,7,40),goldMat);houseGold.rotation.x=Math.PI/2;houseGold.position.y=14.1;house.add(houseGold);
const doorway=new THREE.Mesh(new THREE.PlaneGeometry(5,8),new THREE.MeshBasicMaterial({color:0x957b58,side:THREE.DoubleSide}));doorway.position.set(0,4,14.03);house.add(doorway);
house.position.set(154,heightAt(154,-173),-173);scene.add(house);
const waterfallMat=new THREE.MeshBasicMaterial({color:0xb3eff0,transparent:true,opacity:.65,side:THREE.DoubleSide});
const falls=[];
for(let i=0;i<7;i++){
 const x=69+i*2.4,z=91+Math.sin(i*.9)*2;
 const h=14+rnd()*9;const fall=new THREE.Mesh(new THREE.PlaneGeometry(2.3,h,3,15),waterfallMat);
 fall.position.set(x,heightAt(x,z)+h/2-3,z);fall.rotation.y=.15;scene.add(fall);falls.push(fall);
}
const seedLights=[];
const prayerGroup=new THREE.Group();scene.add(prayerGroup);
const interactive=[];
function seedAt(x,z,kind,entity){
 const pos=v3(x,heightAt(x,z)+2.4,z);
 const gp=new THREE.Group();gp.position.set(x,heightAt(x,z),z);
 const color=kind==='testimony'?0xffc4d6:0xffe4a1;
 const center=new THREE.Mesh(new THREE.IcosahedronGeometry(kind==='testimony'?.75:.62,2),new THREE.MeshBasicMaterial({color}));
 center.position.y=2.5;gp.add(center);
 const halo=new THREE.Mesh(new THREE.SphereGeometry(1.55,12,10),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.23,depthWrite:false,blending:THREE.AdditiveBlending}));halo.position.y=2.5;gp.add(halo);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.05,9,32),goldMat);ring.position.y=2.5;ring.rotation.y=.32;gp.add(ring);
 prayerGroup.add(gp);seedLights.push(gp);interactive.push({pos,kind,entity,group:gp});return gp;
}
function resetSeeds(){
 while(prayerGroup.children.length){const obj=prayerGroup.children[0];prayerGroup.remove(obj);obj.traverse(n=>{if(n.isMesh){n.geometry.dispose();if(n.material!==goldMat)n.material.dispose();}});}
 interactive.splice(0,interactive.length);seedLights.length=0;
}
let publicPrayers=[],liveError='';
async function loadPrayers(){
 try{
  const r=await fetch('/api/public-prayers',{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('HTTP '+r.status);
  const data=await r.json();if(!Array.isArray(data.prayers))throw Error('Format invalide');
  publicPrayers=data.prayers.filter(p=>p&&p.id&&p.status!=='removed');
  resetSeeds();
  publicPrayers.slice(0,100).forEach((p,i)=>{
   const testimony=p.status==='answered';
   const a=i*golden,r=22+Math.sqrt(i)*8.3;
   const base=testimony?biomes[4]:biomes[2];
   const x=base.x+Math.cos(a)*r,z=base.z+Math.sin(a)*r*.77;
   seedAt(x,z,testimony?'testimony':'prayer',p);
  });
  const n=publicPrayers.length;setText('liveStatus',n?String(n)+' intention(s) publiques synchronisée(s)':'Aucune intention publique actuellement affichée');
  liveError='';show('liveStatus',true);
 }catch(e){
  console.warn('Synchronisation impossible:',e);
  liveError='Impossible de charger les prières publiques maintenant.';
  setText('liveStatus',liveError);show('liveStatus',true);
 }
}

/* Le monde évolue derrière la vue, par étapes pour conserver un démarrage rapide. */
const expeditionScene=createEternalRealm({scene,biomes,heightAt,mobile,forestTrees});
const VISIT_KEY='eternel-3d-biome-discoveries-v1';
const discovered=new Set();
try{const old=JSON.parse(localStorage.getItem(VISIT_KEY)||'[]');if(Array.isArray(old))old.filter(x=>biomes.some(b=>b.id===x)).forEach(x=>discovered.add(x));}catch{}
let noticeTimeout=0;
function updateExpeditionHUD(){
 setText('progressValue',discovered.size+' / 7 BIOMES DÉCOUVERTS');
 const upcoming=biomes.find(b=>!discovered.has(b.id));
 if(!upcoming)setText('journeyGoal','Les sept territoires sont découverts · Continuez librement.');
 else {
  const dist=Math.round(Math.hypot(state.position.x-upcoming.x,state.position.z-upcoming.z));
  setText('journeyGoal','À DÉCOUVRIR · '+upcoming.name+' · '+dist+' m');
 }
}
function markBiome(index,announce=true){
 const biome=biomes[index];
 if(!biome||discovered.has(biome.id))return;
 discovered.add(biome.id);
 try{localStorage.setItem(VISIT_KEY,JSON.stringify([...discovered]));}catch{}
 updateExpeditionHUD();
 if(announce){
  setText('discoveryNumber',String(discovered.size).padStart(2,'0')+' / 07 · TERRITOIRE DÉCOUVERT');
  setText('discoveryName',biome.name);
  show('discoveryToast',true);
  clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>show('discoveryToast',false),3700);
 }
}
const minimap=document.getElementById('minimapCanvas');
const miniCtx=minimap?.getContext('2d');
function updateMinimap(){
 if(!miniCtx||!minimap)return;
 const w=minimap.width,h=minimap.height;
 miniCtx.clearRect(0,0,w,h);
 const convert=(p)=>({x:clamp((p.x+305)/610,0,1)*w,y:clamp((p.z+345)/610,0,1)*h});
 miniCtx.fillStyle='rgba(13,47,39,.86)';miniCtx.fillRect(0,0,w,h);
 const grd=miniCtx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/1.6);grd.addColorStop(0,'rgba(143,190,147,.25)');grd.addColorStop(1,'rgba(35,90,66,.09)');miniCtx.fillStyle=grd;miniCtx.fillRect(0,0,w,h);
 const ways=[[0,1],[1,2],[2,3],[2,4],[2,5],[4,6],[5,6]];
 miniCtx.lineWidth=1.5;miniCtx.strokeStyle='rgba(239,217,163,.45)';
 for(const [i,j]of ways){
  const a=convert(biomes[i]),b=convert(biomes[j]);
  miniCtx.beginPath();miniCtx.moveTo(a.x,a.y);miniCtx.lineTo(b.x,b.y);miniCtx.stroke();
 }
 biomes.forEach(b=>{
  const p=convert(b);
  miniCtx.beginPath();miniCtx.arc(p.x,p.y,discovered.has(b.id)?4.5:3.5,0,Math.PI*2);
  miniCtx.fillStyle=discovered.has(b.id)?'#ffdf97':'#89ac9d';miniCtx.fill();
  miniCtx.strokeStyle='#194a40';miniCtx.lineWidth=1.5;miniCtx.stroke();
 });
 const player=convert(state.position);
 miniCtx.save();miniCtx.translate(player.x,player.y);miniCtx.rotate(-state.yaw);
 miniCtx.beginPath();miniCtx.moveTo(0,-10);miniCtx.lineTo(-6,7);miniCtx.lineTo(0,3);miniCtx.lineTo(6,7);miniCtx.closePath();
 miniCtx.fillStyle='#fffef0';miniCtx.fill();
 miniCtx.restore();
}
let cinematic=false;
function toggleCinematic(){
 cinematic=!cinematic;
 ROOT.classList.toggle('cinema',cinematic);
 show('cinemaExit',cinematic);
}
const state={playing:false,overlay:false,near:null,biome:0,yaw:0,pitch:-.07,position:v3(5,0,192),move:{x:0,y:0},pointer:null,frame:0,last:performance.now(),fpsAt:0,frames:0,quality:Math.min(devicePixelRatio||1,frameCap)};
const pressed=new Set();
function nearestBiome(){
 let near=biomes[0],dist=Infinity,index=0;
 biomes.forEach((b,i)=>{const d=distance(state.position.x,state.position.z,b);if(d<dist){dist=d;near=b;index=i;}});
 return {b:near,index,dist};
}
function updateBiome(){
 const n=nearestBiome();
 if(n.dist<43)markBiome(n.index);
 if(n.index===state.biome)return;
 state.biome=n.index;
 setText('biomeIndex',String(n.index+1).padStart(2,'0')+' / 07 · VOUS DÉCOUVREZ');
 setText('biomeName',n.b.name);setText('biomeSubtitle',n.b.caption);
}
function updateNear(){
 let target=null,dist=11;
 for(const entry of interactive){
  const d=distance(state.position.x,state.position.z,entry.pos);
  if(d<dist){target=entry;dist=d;}
 }
 if(!target){
  for(const b of biomes){
   const d=distance(state.position.x,state.position.z,b);
   if(d<13&&d<dist){dist=d;target={kind:'biome',entity:b,pos:v3(b.x,0,b.z)};}
  }
 }
 if(target===state.near)return;
 if(target&&state.near&&target.kind===state.near.kind&&target.entity?.id===state.near.entity?.id)return;
 state.near=target;
 show('near',Boolean(target));
 if(target){
  setText('nearCategory',target.kind==='testimony'?'TÉMOIGNAGE PUBLIÉ':target.kind==='prayer'?'INTENTION PUBLIQUE':'DÉCOUVERTE DU BIOME');
  setText('nearName',target.entity.title||target.entity.name);
 }
}
function textNode(str){const p=document.createElement('p');p.textContent=String(str||'');return p;}
function displayDetail(type,title,text,meta){
 setText('detailType',type);setText('detailName',title);
 const body=el('detailBody');body.replaceChildren(textNode(text));
 setText('detailMeta',meta||'');show('detailOverlay',true);state.overlay=true;
}
function interactWith(target){
 if(!target)return;
 const p=target.entity;
 if(target.kind==='prayer')displayDetail('INTENTION DE PRIÈRE PUBLIÉE',p.title,p.detail,'Catégorie : '+p.category+' · '+(p.anonymous?'Anonyme':p.authorName));
 else if(target.kind==='testimony')displayDetail('TÉMOIGNAGE PARTAGÉ',p.title,p.testimony||'Témoignage déclaré exaucé.',(p.anonymous?'Anonyme':p.authorName)+' · Témoignage déclaré par son auteur');
 else displayDetail('BIOME D’ÉTERNEL',p.name,p.description,'Explorez librement ce paysage. Les données privées sont accessibles depuis l’espace de prière officiel.');
}
function openMap(){
 const cont=el('mapList');cont.replaceChildren();
 biomes.forEach((b,i)=>{
  const btn=document.createElement('button');btn.type='button';
  const small=document.createElement('small');small.textContent=String(i+1).padStart(2,'0')+' / 07 · '+(discovered.has(b.id)?'DÉCOUVERT':'À EXPLORER');
  const h=document.createElement('strong');h.textContent=b.name;
  const cap=document.createElement('span');cap.textContent=b.caption;
  btn.append(small,h,cap);
  btn.addEventListener('click',()=>{
   state.position.set(b.x+6,0,b.z+19);state.yaw=0;state.pitch=-.09;
   show('mapOverlay',false);state.overlay=false;updateBiome();canvas.focus();
  });cont.append(btn);
 });
 show('mapOverlay',true);state.overlay=true;
}
const communityURL='https://eternel-le-jardin-des-intercessions-dgus86.v2.appdeploy.ai/';
function openCommunity(){show('communityOverlay',true);state.overlay=true;}
function closeOverlay(id){show(id,false);state.overlay=false;canvas.focus();}
el('enter').addEventListener('click',()=>{
 state.playing=true;show('intro',false);
 ['top','location','hints','liveStatus','expeditionHUD'].forEach(id=>show(id,true));
 markBiome(0,false);updateExpeditionHUD();updateMinimap();
 if(mobile)show('touch',true);
 updateBiome();canvas.focus();
});
el('openMap').addEventListener('click',openMap);
el('minimapButton').addEventListener('click',openMap);
el('cinemaButton').addEventListener('click',toggleCinematic);
el('cinemaExit').addEventListener('click',toggleCinematic);
el('fullScreenButton').addEventListener('click',()=>{
 if(document.fullscreenElement){void document.exitFullscreen?.();}
 else{const p=ROOT.requestFullscreen?.();if(p?.catch)p.catch(()=>{});}
});
el('closeMap').addEventListener('click',()=>closeOverlay('mapOverlay'));
el('nearAction').addEventListener('click',()=>interactWith(state.near));
el('touchAction').addEventListener('click',()=>interactWith(state.near));
el('closeDetail').addEventListener('click',()=>closeOverlay('detailOverlay'));
el('resume').addEventListener('click',()=>closeOverlay('detailOverlay'));
el('gotoCommunity').addEventListener('click',openCommunity);
el('openCommunity').addEventListener('click',openCommunity);
el('closeCommunity').addEventListener('click',()=>closeOverlay('communityOverlay'));
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){['mapOverlay','detailOverlay','communityOverlay'].forEach(id=>show(id,false));state.overlay=false;return;}
 const active=document.activeElement;
 if(active&&['INPUT','TEXTAREA','SELECT'].includes(active.tagName))return;
 const key=e.key.toLowerCase();
 pressed.add(key);if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();
 if(key==='e'&&!e.repeat&&state.playing&&!state.overlay)interactWith(state.near);
 if(key==='m'&&!e.repeat&&state.playing)openMap();
 if(key==='p'&&!e.repeat&&state.playing)toggleCinematic();
 if(key==='f'&&!e.repeat&&state.playing){if(document.fullscreenElement)void document.exitFullscreen?.();else ROOT.requestFullscreen?.().catch?.(()=>{});}
});document.addEventListener('keyup',e=>pressed.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>pressed.clear());
let dragging=false,px=0,py=0,moved=false,downPointer=-1;
canvas.addEventListener('pointerdown',e=>{
 dragging=true;px=e.clientX;py=e.clientY;moved=false;downPointer=e.pointerId;
 try{canvas.setPointerCapture(e.pointerId)}catch{}
});
canvas.addEventListener('pointermove',e=>{
 if(!dragging||e.pointerId!==downPointer||state.overlay)return;
 const dx=e.clientX-px,dy=e.clientY-py;
 if(Math.abs(dx)+Math.abs(dy)>3)moved=true;
 state.yaw-=dx*.0034;state.pitch=clamp(state.pitch-dy*.0024,-.78,.68);
 px=e.clientX;py=e.clientY;
});
canvas.addEventListener('pointerup',e=>{
 if(e.pointerId!==downPointer)return;
 dragging=false;
 if(!state.playing||state.overlay||moved)return;
 const rect=canvas.getBoundingClientRect();
 const ndc=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
 const ray=new THREE.Raycaster();ray.setFromCamera(ndc,camera);
 const hits=ray.intersectObjects(interactive.map(a=>a.group),true);
 if(hits.length){
  const found=interactive.find(a=>{let g=hits[0].object;while(g){if(g===a.group)return true;g=g.parent;}return false;});
  if(found&&distance(state.position.x,state.position.z,found.pos)<20)interactWith(found);
 }
});
const joy=el('joystick'),stick=el('stick');
const joystickMove=e=>{
 const r=joy.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width*.35),y=(e.clientY-r.top-r.height/2)/(r.height*.35);
 state.move.x=clamp(x,-1,1);state.move.y=clamp(y,-1,1);
 stick.style.transform='translate('+(state.move.x*29)+'px,'+(state.move.y*29)+'px)';
};
joy.addEventListener('pointerdown',e=>{e.preventDefault();joy.setPointerCapture(e.pointerId);joystickMove(e);});
joy.addEventListener('pointermove',e=>{if(joy.hasPointerCapture(e.pointerId))joystickMove(e)});
const joyEnd=()=>{state.move.x=0;state.move.y=0;stick.style.transform='translate(0px,0px)';};
joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
let ambient=null;
el('sound').addEventListener('click',async()=>{
 if(ambient){await ambient.close();ambient=null;el('sound').textContent='♫';return;}
 try{
  const ctx=new AudioContext(),buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),samples=buf.getChannelData(0);
  let x=0;for(let i=0;i<samples.length;i++){x=(x+(Math.random()*2-1)*.019)/1.019;samples[i]=x*.24;}
  const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=380;
  const gain=ctx.createGain();gain.gain.value=.12;src.connect(filter);filter.connect(gain);gain.connect(ctx.destination);src.start();
  ambient=ctx;el('sound').textContent='♪';
 }catch(e){console.warn('Audio not available',e)}
});
let lastFrames=0,statsTimer=performance.now();
function render(now){
 requestAnimationFrame(render);
 const dt=Math.min(.05,(now-state.last)/1000);state.last=now;
 if(state.playing&&!state.overlay){
  const f=Number(pressed.has('w')||pressed.has('z')||pressed.has('arrowup'))-Number(pressed.has('s')||pressed.has('arrowdown'))-state.move.y;
  const s=Number(pressed.has('d'))-Number(pressed.has('a')||pressed.has('q'))+state.move.x;
  const len=Math.max(1,Math.hypot(f,s)),vel=(pressed.has('shift')?20:speedNormal)*dt;
  const nx=state.position.x+(Math.sin(state.yaw)*f+Math.cos(state.y)*s)/len*vel;
  const nz=state.position.z+(-Math.cos(state.y)*f+Math.sin(state.y)*s)/len*vel;
  if(nx>-287&&nx<287&&nz>-315&&nz<252&&Math.hypot(nx+12,nz+35)>5){
   let blocked=false;
   for(const t of forestTrees)if(distance(nx,nz,t)<(t.hero?7:1.15*t.scale)){blocked=true;break;}
   if(!blocked)state.position.set(nx,0,nz);
  }
  const turn=Number(pressed.has('arrowright'))-Number(pressed.has('arrowleft'));state.yaw-=turn*dt*1.2;
  updateBiome();
  if(state.frame%30===0)updateNear();
 }
 camera.position.set(state.position.x,heightAt(state.position.x,state.position.z)+camHeight+Math.sin(now*.004)*.015,state.position.z);
 camera.rotation.order='YXZ';camera.rotation.y=state.yaw;camera.rotation.x=state.pitch;
 sky.position.copy(camera.position);
 if(state.frame%2===0){
  motes.rotation.y=Math.sin(now*.00008)*.015;
  seedLights.forEach((g,i)=>{g.rotation.y=now*.00019+(i*.8);g.children[1].scale.setScalar(1+.13*Math.sin(now*.002+i));});
  riverMat.roughness=.15+.06*Math.sin(now*.0008);
 }
 expeditionScene.update(now,state.position);
 if(state.frame%20===0){updateExpeditionHUD();updateMinimap();}
 sun.intensity=3.0+.23*Math.sin(now*.00008);
 renderer.render(scene,camera);
 state.frame++;lastFrames++;
 if(now-statsTimer>2700){
  const rate=Math.round(lastFrames/(now-statsTimer)*1000);
  setText('fps',rate+' FPS · '+(mobile?'MOBILE':'ORDINATEUR'));
  if(rate<23&&state.quality>.75){state.quality=Math.max(.75,state.quality*.85);renderer.setPixelRatio(state.quality)}
  lastFrames=0;statsTimer=now;
 }
}
function onResize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)}
window.addEventListener('resize',onResize);window.addEventListener('orientationchange',()=>setTimeout(onResize,200));
camera.position.set(5,3.2,192);camera.rotation.y=0;
requestAnimationFrame(render);
setTimeout(()=>{show('loader',false);show('intro',true)},200);
loadPrayers();
setInterval(()=>{if(document.visibilityState==='visible')loadPrayers()},90000);
