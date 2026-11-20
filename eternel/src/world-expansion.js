import * as THREE from 'three';
/*
 * ÉTERNEL — Habitats interactifs.
 * Décors originaux procéduraux, sans lien vers des assets externes non licenciés.
 * Végétation dessinée par atlas et instancing pour préserver le budget mobile.
 */
const PI=Math.PI;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const random=(seed)=>{let x=(Math.abs(Math.floor(seed))%2147483646)+1;return()=>{x=(x*16807)%2147483647;return(x-1)/2147483646;}};
function texture(draw,w=128,h=128){
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;const cx=cv.getContext('2d');
 draw(cx,w,h);
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=2;return t;
}
const paintBroadLeaf=(cx,w,h)=>{
 cx.clearRect(0,0,w,h);
 const g=cx.createLinearGradient(8,0,w-12,h);
 g.addColorStop(0,'#dcf8a4');g.addColorStop(.32,'#90d275');g.addColorStop(.8,'#2f9068');g.addColorStop(1,'#23644f');
 cx.fillStyle=g;cx.beginPath();
 cx.moveTo(w*.5,h*.96);
 cx.bezierCurveTo(w*.03,h*.74,w*.01,h*.25,w*.45,h*.04);
 cx.bezierCurveTo(w*.76,h*.04,w*.98,h*.42,w*.5,h*.96);
 cx.fill();
 cx.lineCap='round';cx.strokeStyle='rgba(247,255,215,.54)';cx.lineWidth=2;
 cx.beginPath();cx.moveTo(w*.5,h*.95);cx.quadraticCurveTo(w*.58,h*.5,w*.47,h*.09);cx.stroke();
 for(let i=0;i<7;i++){
  const y=h*(.22+i*.095),side=i%2?1:-1;
  cx.beginPath();cx.moveTo(w*.51,y);cx.lineTo(w*(.5+side*(.27-i*.02)),y-h*.075);
  cx.strokeStyle='rgba(234,252,212,.24)';cx.lineWidth=1;cx.stroke();
 }
};
const paintFern=(cx,w,h)=>{
 cx.clearRect(0,0,w,h);
 cx.lineCap='round';cx.strokeStyle='#afd28c';cx.lineWidth=2.5;
 cx.beginPath();cx.moveTo(w*.5,h*.97);cx.bezierCurveTo(w*.43,h*.6,w*.6,h*.28,w*.53,h*.03);cx.stroke();
 for(let i=1;i<16;i++){
  const t=i/17,y=h*(.95-.85*t),len=Math.sin(PI*t)*w*.40;
  for(const side of [-1,1]){
   const x=w*.5+side*len;
   cx.fillStyle=i%3===0?'#9ace8c':'#66a77b';
   cx.beginPath();cx.moveTo(w*.5,y);
   cx.quadraticCurveTo(w*.5+side*len*.50,y-h*.08,x,y-h*.07);
   cx.quadraticCurveTo(w*.5+side*len*.60,y+h*.012,w*.5,y+h*.02);
   cx.fill();
  }
 }
};
const paintOrchid=(cx,w,h)=>{
 cx.clearRect(0,0,w,h);
 for(let i=0;i<6;i++){
  const a=i*PI/3,px=w/2+Math.cos(a)*w*.22,py=h/2+Math.sin(a)*h*.22;
  const grad=cx.createRadialGradient(px,py,1,px,py,w*.25);
  grad.addColorStop(0,'#fff4d7');grad.addColorStop(.28,'#ffe3ed');grad.addColorStop(.75,'#eea1c9');grad.addColorStop(1,'rgba(220,112,178,0)');
  cx.fillStyle=grad;cx.beginPath();cx.ellipse(px,py,w*.19,h*.22,a,0,PI*2);cx.fill();
 }
 cx.fillStyle='#ffe79b';cx.beginPath();cx.arc(w/2,h/2,w*.09,0,PI*2);cx.fill();
};
function leafGeom(width,height,curve=.21){
 const pos=[],uv=[],idx=[];
 const sides=6;
 for(let j=0;j<=sides;j++){
  const t=j/sides,wide=Math.sin(PI*t);
  for(let side of [-1,1]){
   pos.push(side*width*.5*wide,height*t,Math.sin(PI*t)*curve);
   uv.push(side===-1?0:1,t);
  }
  if(j<sides){const n=j*2;idx.push(n,n+1,n+2,n+1,n+3,n+2);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function color(hex){return new THREE.Color(hex)}
function instanced(g,material,count){const mesh=new THREE.InstancedMesh(g,material,count);mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);return mesh;}
function pathTube(points,r=0.1,segments=10){
 return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),segments,r,5,false);
}
export function createEternalRealm({scene,biomes,heightAt,mobile,forestTrees}){
 const r=random(83091),objects=[],timed=[],water=[];
 const plantAtlas=texture(paintBroadLeaf,96,192),fernAtlas=texture(paintFern,128,192),orchidAtlas=texture(paintOrchid,128,128);
 const mats={
   palm:new THREE.MeshStandardMaterial({map:plantAtlas,alphaTest:.28,transparent:true,side:THREE.DoubleSide,roughness:.86,color:'#c8eec3'}),
   fern:new THREE.MeshStandardMaterial({map:fernAtlas,alphaTest:.29,transparent:true,side:THREE.DoubleSide,roughness:.95,color:'#c8ebbe'}),
   orchid:new THREE.MeshBasicMaterial({map:orchidAtlas,alphaTest:.12,transparent:true,side:THREE.DoubleSide,color:'#fff6f5',depthWrite:false}),
   bark:new THREE.MeshStandardMaterial({color:'#746454',roughness:1,flatShading:false}),
   moss:new THREE.MeshStandardMaterial({color:'#5f9369',roughness:1}),
   marble:new THREE.MeshStandardMaterial({color:'#f7e8c9',metalness:.02,roughness:.68}),
   gold:new THREE.MeshStandardMaterial({color:'#dabe7b',metalness:.52,roughness:.30}),
   stone:new THREE.MeshStandardMaterial({color:'#a4aaa0',roughness:1}),
   aqua:new THREE.MeshPhysicalMaterial({color:'#7acac2',metalness:.12,roughness:.2,transparent:true,opacity:.9,side:THREE.DoubleSide}),
 };
 const dummy=new THREE.Object3D(),tint=new THREE.Color();
 const jungleBiomes=biomes.filter(b=>['aube','central','arbre','alliances'].includes(b.id));
 const inBiome=(b,rad=78)=>({x:b.x+(r()-.5)*rad*2,z:b.z+(r()-.5)*rad*2});
 function ground(x,z){return heightAt(x,z)}
 function inWater(x,z){return Math.abs(x-(68+(58-68)*clamp((215-z)/137,0,1)))<8 && z>70&&z<215}
 function flatArea(x,z){return Math.abs(x+12)<8&&Math.abs(z+35)<8}
 function add(mesh){scene.add(mesh);objects.push(mesh);return mesh}
 function buildPalms(){
  // Canopy in three strata: 900+ independent, curved, real leaf meshes; only three draw calls.
  const palmCount=mobile?68:130,leavesPer=9;
  const trunk=instanced(new THREE.CylinderGeometry(.13,.36,1,7,3),mats.bark,palmCount);
  const leaves=instanced(leafGeom(2.25,6,.85),mats.palm,palmCount*leavesPer);
  const bases=[];
  for(let i=0;i<palmCount;i++){
   const b=jungleBiomes[Math.floor(r()*jungleBiomes.length)];
   const at=inBiome(b,b.id==='aube'?105:78);
   if(inWater(at.x,at.z)||flatArea(at.x,at.z))continue;
   const h=12+r()*12,sc=.72+r()*.65,y=ground(at.x,at.z);
   bases.push({x:at.x,z:at.z,scale:1.0});
   dummy.position.set(at.x,y+h*.5,at.z);dummy.rotation.set(.05*r(),r()*PI*2,.045*r());dummy.scale.set(sc,h,sc);
   dummy.updateMatrix();trunk.setMatrixAt(i,dummy.matrix);
   tint.setHSL(.08+r()*.04,.13,.29+r()*.14);trunk.setColorAt(i,tint);
   for(let j=0;j<leavesPer;j++){
    const n=i*leavesPer+j;
    dummy.position.set(at.x,y+h*.92,at.z);
    // Leaf tip sweeps out from the summit, broad blades form natural umbrella.
    dummy.rotation.set(-1.12-r()*.28,j*PI*2/leavesPer+r()*.23,(r()-.5)*.27);
    const size=(.72+r()*.55)*sc;dummy.scale.set(size,size*(.85+r()*.25),size);
    dummy.updateMatrix();leaves.setMatrixAt(n,dummy.matrix);
    tint.setHSL(.265+r()*.095,.28+r()*.16,.49+r()*.26);leaves.setColorAt(n,tint);
   }
  }
  trunk.instanceMatrix.needsUpdate=true;leaves.instanceMatrix.needsUpdate=true;
  add(trunk);add(leaves);
  // Collision against a small number of trunks close to paths.
  bases.forEach((p,i)=>{if(i%4===0)forestTrees.push({x:p.x,z:p.z,scale:.55,hero:false})});
 }
 function buildGroundPlants(){
  const fernCount=mobile?900:1750,leafCount=mobile?2200:5300,flowerCount=mobile?1350:3600;
  const fern=instanced(new THREE.PlaneGeometry(1.5,2.4),mats.fern,fernCount);
  const leaves=instanced(new THREE.PlaneGeometry(2.2,3.6),mats.palm,leafCount);
  const orchid=instanced(new THREE.PlaneGeometry(1.55,1.55),mats.orchid,flowerCount);
  // These are understory plants that fill the jungle between trees.
  for(let i=0;i<fernCount;i++){
   const b=jungleBiomes[Math.floor(r()*jungleBiomes.length)],p=inBiome(b);
   dummy.position.set(p.x,ground(p.x,p.z)+1.08,p.z);
   dummy.rotation.set(-.3-r()*.2,r()*PI*2,0);
   const size=.5+r()*1.8;dummy.scale.set(size,size,size);dummy.updateMatrix();fern.setMatrixAt(i,dummy.matrix);
   tint.setHSL(.28+r()*.12,.30+r()*.25,.38+r()*.24);fern.setColorAt(i,tint);
  }
  for(let i=0;i<leafCount;i++){
   const b=jungleBiomes[Math.floor(r()*jungleBiomes.length)],p=inBiome(b);
   const sc=.65+r()*2.2;
   dummy.position.set(p.x,ground(p.x,p.z)+sc*1.2,p.z);
   dummy.rotation.set(.10+r()*.65,r()*PI*2,r()*.24);
   dummy.scale.set(sc,sc,sc);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
   tint.setHSL(.27+r()*.15,.25+r()*.32,.46+r()*.22);leaves.setColorAt(i,tint);
  }
  for(let i=0;i<flowerCount;i++){
   const b=r()<.62?biomes[4]:biomes[Math.floor(r()*biomes.length)];
   const p=inBiome(b,65),sc=.4+r()*1.9;
   dummy.position.set(p.x,ground(p.x,p.z)+.6+r()*.9,p.z);
   dummy.rotation.set(r()*PI,r()*PI*2,r()*PI);dummy.scale.setScalar(sc);dummy.updateMatrix();
   orchid.setMatrixAt(i,dummy.matrix);
   tint.setHSL(b.id==='temoignages'?.87+r()*.1:r()*.24,.43+r()*.18,.78+r()*.19);
   orchid.setColorAt(i,tint);
  }
  fern.instanceMatrix.needsUpdate=true;leaves.instanceMatrix.needsUpdate=true;orchid.instanceMatrix.needsUpdate=true;
  add(fern);add(leaves);add(orchid);
 }
 function vinesAndRoots(){
  const wood=[],curves=[],treeLocations=[
    ...jungleBiomes.flatMap((b,j)=>Array.from({length:j===3?10:6},(_,i)=>{
      const a=i*2.3999,radius=19+i*3;
      return{x:b.x+Math.cos(a)*radius,z:b.z+Math.sin(a)*radius,height:14+r()*9};
    }))
  ];
  // Curved hanging lianas, banyan-like buttress roots, trunk epiphytes.
  for(let i=0;i<treeLocations.length;i++){
   const loc=treeLocations[i];
   const y=ground(loc.x,loc.z),s=.65+r()*.9;
   const branchLength=6+r()*8;
   const strands=3+(i%3);
   for(let j=0;j<strands;j++){
    const a=j*PI*2/strands+r()*1.5,dx=Math.cos(a),dz=Math.sin(a);
    const p1=new THREE.Vector3(loc.x,y+loc.height*.85,loc.z);
    const p2=new THREE.Vector3(loc.x+dx*branchLength*.55,y+loc.height*.92,loc.z+dz*branchLength*.55);
    const p3=new THREE.Vector3(loc.x+dx*branchLength,y+loc.height*.47,loc.z+dz*branchLength);
    const p4=new THREE.Vector3(p3.x,y+loc.height*.36-r()*3,p3.z);
    curves.push(pathTube([p1,p2,p3,p4],.06*s,16));
   }
   for(let j=0;j<5;j++){
    const a=j*PI*2/5,dx=Math.cos(a),dz=Math.sin(a);
    const p1=new THREE.Vector3(loc.x+dx*.7,y+.8,loc.z+dz*.7);
    const p2=new THREE.Vector3(loc.x+dx*1.6,y+.42,loc.z+dz*1.6);
    const p3=new THREE.Vector3(loc.x+dx*(4.4+r()*2.6),y+.12,loc.z+dz*(4.4+r()*2.6));
    wood.push(pathTube([p1,p2,p3],.16*s,12));
   }
  }
  // Merging requires congruent vertex attributes; TubeGeometry's are compatible.
  // Keep single material draw per woodland region, not one draw per vine.
  function combine(geos,material){
   if(!geos.length)return;
   const {mergeGeometries}=THREE.BufferGeometryUtils||{};
   // Loaded geometries share attributes, but groups are cheap when merge isn't available.
   if(mergeGeometries){
     const merged=mergeGeometries(geos,false);if(merged)add(new THREE.Mesh(merged,material));
   } else {
     // Native utility is bundled in the calling chunk via the package itself below.
     // Avoid thousands of separate objects if the helper is unavailable.
     const positions=[],normals=[],uvs=[],indices=[];
     let offset=0;
     for(const g of geos){
       const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv'),ix=g.getIndex();
       for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));uvs.push(uv.getX(i),uv.getY(i));}
       for(let i=0;i<ix.count;i++)indices.push(ix.getX(i)+offset);
       offset+=p.count;
     }
     const geom=new THREE.BufferGeometry();
     geom.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
     geom.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
     geom.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geom.setIndex(indices);
     add(new THREE.Mesh(geom,material));
   }
   geos.forEach(g=>g.dispose());
  }
  combine(wood,mats.bark);
  combine(curves,new THREE.MeshStandardMaterial({color:'#477650',roughness:1}));
 }
 function giantFlora(){
  // Landmark flowers: substantial sculptural petals (not identical miniature sprites).
  const lilyGeometry=new THREE.SphereGeometry(1,10,8);
  const pad=new THREE.CircleGeometry(1,28),padMat=new THREE.MeshStandardMaterial({color:'#447f68',side:THREE.DoubleSide,roughness:.7});
  const pads=instanced(pad,padMat,mobile?140:280);
  const lake=biomes[4],b=biomes[1];
  for(let i=0;i<pads.count;i++){
    const inLake=i%3===0,base=inLake?lake:b;
    const x=base.x+(r()-.5)*90,z=base.z+(r()-.5)*80;
    dummy.position.set(x,ground(x,z)+.2,z);dummy.rotation.set(-PI/2,0,r()*6.28);
    const s=.4+r()*2;dummy.scale.set(s,s,s);dummy.updateMatrix();pads.setMatrixAt(i,dummy.matrix);
  }
  pads.instanceMatrix.needsUpdate=true;add(pads);
  const flowerTotal=mobile?17:40;
  const lily=new THREE.Group();
  for(let i=0;i<flowerTotal;i++){
    const b=i%3===0?biomes[4]:biomes[i%5===0?0:1];
    const a=r()*PI*2,rad=6+r()*52;
    const x=b.x+Math.cos(a)*rad,z=b.z+Math.sin(a)*rad,sc=1+r()*2;
    const flower=new THREE.Group();flower.position.set(x,ground(x,z)+.55,z);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.13,.22,2.4,7),mats.moss);
    stem.position.y=1.2;flower.add(stem);
    const center=new THREE.Mesh(new THREE.SphereGeometry(.48,12,8),new THREE.MeshStandardMaterial({color:'#ffe19c',emissive:'#91652f',emissiveIntensity:.6}));
    center.position.y=2.6;flower.add(center);
    const petMat=new THREE.MeshStandardMaterial({color:i%4===0?'#fce7ac':'#f9c4da',side:THREE.DoubleSide,roughness:.76,emissive:'#664259',emissiveIntensity:.08});
    for(let j=0;j<7;j++){
      const pet=new THREE.Mesh(leafGeom(.98,2.4,.3),petMat);
      pet.position.set(0,2.45,0);pet.rotation.set(-1.09,j*PI*2/7,.05);
      flower.add(pet);
    }
    flower.scale.setScalar(sc);lily.add(flower);
  }
  add(lily);
 }
 function mistAndWaterfalls(){
  // Rapids and vertical veils near the Dawn Valley and northern mountain.
  const shader=new THREE.ShaderMaterial({
   uniforms:{uTime:{value:0},uTint:{value:new THREE.Color('#a2edf4')}},
   transparent:true,depthWrite:false,side:THREE.DoubleSide,
   vertexShader:'varying vec2 vUv; uniform float uTime; void main(){ vUv=uv; vec3 p=position; p.z+=sin(uv.y*18.0+uTime*1.7+uv.x*9.0)*.16; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }',
   fragmentShader:'varying vec2 vUv;uniform float uTime;uniform vec3 uTint;void main(){float foam=pow(max(0.,sin(vUv.x*39.+sin(vUv.y*12.+uTime)*3.))*0.5+0.5,5.);float shimmer=sin(vUv.y*42.-uTime*5.+vUv.x*7.)*.12;float edge=smoothstep(0.,.12,vUv.x)*(1.-smoothstep(.85,1.,vUv.x));vec3 col=mix(uTint,vec3(1.),clamp(foam*.7+shimmer+.14,0.,1.));gl_FragColor=vec4(col,clamp(edge*(.5+foam*.33+shimmer),0.,.9));}'
  });
  const waterfalls=[
   {x:74,z:106,h:19,w:13}, {x:58,z:90,h:12,w:8},
   {x:-66,z:-264,h:23,w:10}
  ];
  for(let w of waterfalls){
   const group=new THREE.Group();
   const curtain=new THREE.Mesh(new THREE.PlaneGeometry(w.w,w.h,12,30),shader);
   curtain.position.set(w.x,ground(w.x,w.z)+w.h/2,w.z);curtain.rotation.y=.2;group.add(curtain);
   for(let j=0;j<8;j++){
    const x=w.x+(r()-.5)*w.w*1.4,z=w.z+(r()-.5)*6;
    const peb=new THREE.Mesh(new THREE.IcosahedronGeometry(1+r()*2,1),mats.stone);
    peb.position.set(x,ground(x,z)+.9,z);peb.scale.set(1.2+r(),.4+r()*.8,1.4);group.add(peb);
   }
   add(group);
  }
  water.push(shader);
  const fogMat=new THREE.MeshBasicMaterial({color:'#f0faff',transparent:true,opacity:.1,depthWrite:false});
  for(let i=0;i<(mobile?18:38);i++){
   const cloud=new THREE.Mesh(new THREE.PlaneGeometry(15+r()*20,5+r()*9),fogMat.clone());
   cloud.position.set(-65+(r()-.5)*290,5+r()*23,-170+r()*280);cloud.material.opacity=.04+r()*.07;add(cloud);timed.push(cloud);
  }
 }
 function celestialAccents(){
  // Thousands of tiny purely decorative highlights, not fictitious prayer entities.
  const spheres=instanced(new THREE.IcosahedronGeometry(.08,0),
   new THREE.MeshBasicMaterial({color:'#ffe6a1',transparent:true,opacity:.84}),mobile?500:1250);
  const stars=random(761);
  for(let i=0;i<spheres.count;i++){
   const b=biomes[Math.floor(stars()*biomes.length)];
   const x=b.x+(stars()-.5)*130,z=b.z+(stars()-.5)*130;
   dummy.position.set(x,ground(x,z)+1+stars()*19,z);
   dummy.rotation.set(0,stars()*PI*2,0);dummy.scale.setScalar(.5+stars()*4);dummy.updateMatrix();
   spheres.setMatrixAt(i,dummy.matrix);
  }
  spheres.instanceMatrix.needsUpdate=true;add(spheres);timed.push(spheres);
  // Root sanctuary: monumental rings and terraced stone around the heart of the world.
  const x=-12,z=-35,y=ground(x,z);
  for(let j=0;j<3;j++){
   const circle=new THREE.Mesh(new THREE.TorusGeometry(12+j*2.1,.14,8,110),
    new THREE.MeshStandardMaterial({color:j%2?'#e1c48c':'#d2d4ac',metalness:.2,roughness:.7}));
   circle.position.set(x,y+.15+j*.07,z);circle.rotation.x=-PI/2;add(circle);
  }
  for(let i=0;i<9;i++){
   const a=i*2*PI/9,r=23+Math.sin(i)*2;
   const p=new THREE.Mesh(new THREE.CylinderGeometry(.48,.72,5.5,8),mats.marble);
   p.position.set(x+Math.cos(a)*r,y+2.8,z+Math.sin(a)*r);add(p);
   const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.48,1),mats.gold);orb.position.set(p.position.x,y+5.9,p.position.z);add(orb);
  }
 }
 function mountainsAndArchitecture(){
  const rockMat=new THREE.MeshStandardMaterial({color:'#b8c4b6',roughness:1,flatShading:true});
  const rocks=instanced(new THREE.DodecahedronGeometry(1,0),rockMat,mobile?130:260);
  for(let i=0;i<rocks.count;i++){
   const b=i%4===0?biomes[5]:biomes[Math.floor(r()*biomes.length)];
   const x=b.x+(r()-.5)*95,z=b.z+(r()-.5)*95,s=.8+r()*4.5;
   dummy.position.set(x,ground(x,z)+s*.38,z);
   dummy.rotation.set(r(),r()*PI*2,r());dummy.scale.set(s*(.9+r()*.6),s*(.52+r()*.7),s);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
  }
  rocks.instanceMatrix.needsUpdate=true;add(rocks);
  const pillars=new THREE.Group(),house=biomes[6];
  // Courtyard: arches, lamp niches, gilded colonnades toward the House of the Word.
  for(let i=0;i<12;i++){
   const a=i*2*PI/12,x=house.x+Math.cos(a)*30,z=house.z+Math.sin(a)*30;
   const y=ground(x,z);
   const cylinder=new THREE.Mesh(new THREE.CylinderGeometry(.65,.79,8.8,12),mats.marble);cylinder.position.set(x,y+4.4,z);pillars.add(cylinder);
   const cap=new THREE.Mesh(new THREE.CylinderGeometry(1.08,.93,.43,12),mats.gold);cap.position.set(x,y+9,z);pillars.add(cap);
  }
  add(pillars);
  // Ground-level stone steps at the base of the high mountain.
  const b=biomes[5];const stairGroup=new THREE.Group();
  for(let i=0;i<37;i++){
   const zz=b.z+22-i*1.9,xx=b.x+Math.sin(i*.13)*7,yy=ground(xx,zz);
   const step=new THREE.Mesh(new THREE.BoxGeometry(6.7,.25,1.5),mats.marble);
   step.position.set(xx,yy+.2,zz);step.rotation.y=Math.sin(i*.1)*.12;stairGroup.add(step);
  }
  add(stairGroup);
 }
 function createJourneyMemos(){
  const spots=biomes.map((b,i)=>({id:b.id,x:b.x,z:b.z,radius:i===2?39:33}));
  return spots;
 }
 // World creation is organized in batches for optional cancellation and quality tiers.
 buildPalms();
 buildGroundPlants();
 vinesAndRoots();
 giantFlora();
 mistAndWaterfalls();
 celestialAccents();
 mountainsAndArchitecture();
 const landmarks=createJourneyMemos();
 let prevTick=0;
 return {
  landmarks,
  update(now,player){
   if(now-prevTick<85)return;
   prevTick=now;
   for(const shader of water)shader.uniforms.uTime.value=now*.001;
   for(let i=0;i<timed.length;i++)if(i<40){
     const obj=timed[i];
     if(obj instanceof THREE.Mesh&&obj.material?.opacity<.2)obj.position.x+=Math.sin(now*.00017+i)*.003;
   }
  },
  destroy(){
    for(const obj of objects){
      scene.remove(obj);obj.traverse(node=>{if(node.isMesh||node.isInstancedMesh){node.geometry?.dispose();}});
    }
    [plantAtlas,fernAtlas,orchidAtlas].forEach(t=>t.dispose());
  }
 };
}
