import * as THREE from 'three';
const P=Math.PI,TAU=P*2;
const random=(seed)=>()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
const v=(x,y,z)=>new THREE.Vector3(x,y,z);
/** Scene architecture reproduces the user's celestial reference: ivory arcades,
 * gilded domes, staircase terraces, floating rock islands and luminous waterfalls. */
export function createSanctuaries({scene,biomes,heightAt,mobile}){
 const r=random(61477),groups=[],moving=[];
 const stone=new THREE.MeshStandardMaterial({color:'#f7eee0',roughness:.68,metalness:.04});
 const shade=new THREE.MeshStandardMaterial({color:'#b5b39c',roughness:.91});
 const gold=new THREE.MeshStandardMaterial({color:'#d5ae72',roughness:.28,metalness:.6});
 const ivory=new THREE.MeshStandardMaterial({color:'#fffbec',roughness:.44,metalness:.08});
 const glass=new THREE.MeshPhysicalMaterial({color:'#ffdc99',metalness:.05,roughness:.16,transparent:true,opacity:.72,side:THREE.DoubleSide,emissive:'#674529',emissiveIntensity:.32});
 const tealGlass=new THREE.MeshPhysicalMaterial({color:'#91dfdd',metalness:.1,roughness:.20,transparent:true,opacity:.74,side:THREE.DoubleSide,emissive:'#225855',emissiveIntensity:.24});
 const glow=new THREE.MeshBasicMaterial({color:'#ffe7ac',transparent:true,opacity:.9});
 const add=(group,obj)=>{group.add(obj);return obj;};
 const mesh=(geom,mat,x,y,z)=>{const obj=new THREE.Mesh(geom,mat);obj.position.set(x,y,z);return obj;};
 function standingColumn(group,x,y,z,h,material=stone){
  add(group,mesh(new THREE.CylinderGeometry(.42,.56,h,12),material,x,y+h/2,z));
  add(group,mesh(new THREE.CylinderGeometry(.80,.73,.3,12),ivory,x,y+h+.1,z));
  add(group,mesh(new THREE.CylinderGeometry(.72,.79,.32,12),gold,x,y+.20,z));
  add(group,mesh(new THREE.TorusGeometry(.46,.065,5,16),gold,x,y+h-.24,z)).rotation.x=P/2;
 }
 function arch(group,x,y,z,w,h){
  for(const s of [-1,1])standingColumn(group,x+s*w/2,y,z,h);
  add(group,mesh(new THREE.TorusGeometry(w/2,.46,7,54,P),stone,x,y+h,z));
  add(group,mesh(new THREE.TorusGeometry(w/2+.35,.095,5,54,P),gold,x,y+h+.04,z));
  add(group,mesh(new THREE.BoxGeometry(w+1.2,.24,1.6),ivory,x,y+h+w/2+.12,z));
  add(group,mesh(new THREE.BoxGeometry(w+1.4,.13,1.7),gold,x,y+h+w/2+.43,z));
  for(let s of [-1,1]){
    add(group,mesh(new THREE.ConeGeometry(.53,1.9,8),ivory,x+s*w/2,y+h+w/2+1.42,z));
    add(group,mesh(new THREE.IcosahedronGeometry(.22,1),glow,x+s*w/2,y+h+w/2+2.4,z));
  }
 }
 function tower(group,x,y,z,radius,height){
  add(group,mesh(new THREE.CylinderGeometry(radius*.79,radius,height,12),stone,x,y+height/2,z));
  add(group,mesh(new THREE.CylinderGeometry(radius*1.12,radius*1.11,.52,12),gold,x,y+height+.2,z));
  add(group,mesh(new THREE.ConeGeometry(radius*.95,height*.50,12),ivory,x,y+height+height*.25+.46,z));
  add(group,mesh(new THREE.IcosahedronGeometry(.55,2),glow,x,y+height*1.52,z));
  for(let i=0;i<8;i++){
    const a=i*TAU/8,off=radius*.91;
    const w=new THREE.Mesh(new THREE.PlaneGeometry(.52,2.2),glass);
    w.position.set(x+Math.sin(a)*off,y+height*.62,z+Math.cos(a)*off);
    w.rotation.y=a;group.add(w);
  }
 }
 function dome(group,x,y,z,radius,height,color=ivory){
  add(group,mesh(new THREE.CylinderGeometry(radius,radius,height,20),stone,x,y+height/2,z));
  const shell=new THREE.Mesh(new THREE.SphereGeometry(radius,40,22,0,TAU,0,P/2),color);
  shell.position.set(x,y+height,z);group.add(shell);
  const rim=add(group,mesh(new THREE.TorusGeometry(radius,.24,8,70),gold,x,y+height,z));rim.rotation.x=P/2;
  const needle=add(group,mesh(new THREE.ConeGeometry(.35,4.1,9),gold,x,y+height+radius+2,z));
  add(group,mesh(new THREE.IcosahedronGeometry(.52,1),glow,x,y+height+radius+4.2,z));
  return shell;
 }
 function buildMountainCitadel(){
  const zone=biomes[5],g=new THREE.Group();
  g.position.set(zone.x,heightAt(zone.x,zone.z),zone.z);
  // Floating pale terrace halfway up the Mont, framed by mountain spires.
  add(g,mesh(new THREE.CylinderGeometry(27,31,3.2,30),shade,0,1.6,-8));
  add(g,mesh(new THREE.CylinderGeometry(28,28,.34,40),stone,0,3.4,-8));
  dome(g,0,3.7,-8,9,13);
  for(let i=0;i<8;i++){
   const a=i*TAU/8;
   tower(g,Math.sin(a)*23,3.7,-8+Math.cos(a)*23,i%2?1.8:2.8,i%2?12:20);
  }
  for(let i=0;i<4;i++){
   const a=i*TAU/4;
   arch(g,Math.sin(a)*13,3.8,-8+Math.cos(a)*13,9,8);
  }
  for(let k=0;k<12;k++){
   const zz=18-k*2.65;
   const step=add(g,mesh(new THREE.BoxGeometry(12,.28,2.4),stone,0,3.9-k*.12,zz));
   step.rotation.y=.02*Math.sin(k);
  }
  // A waterfall of light drops from the elevated platform (decorative, no users).
  const waterfallMat=new THREE.ShaderMaterial({
   uniforms:{time:{value:0},color:{value:new THREE.Color('#c6f5f2')}},
   vertexShader:'varying vec2 vUv;uniform float time;void main(){vUv=uv;vec3 p=position;p.z+=sin(uv.y*30.+time*1.4+uv.x*7.)*.14;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
   fragmentShader:'varying vec2 vUv;uniform float time;uniform vec3 color;void main(){float wave=.4+.3*sin(vUv.y*65.-time*7.+sin(vUv.x*21.));float fade=smoothstep(.02,.15,vUv.x)*(1.-smoothstep(.8,.99,vUv.x));gl_FragColor=vec4(mix(color,vec3(1.),wave),fade*(.4+wave*.5));}',
   transparent:true,depthWrite:false,side:THREE.DoubleSide
  });
  for(let s of [-1,1]){
   const curtain=add(g,mesh(new THREE.PlaneGeometry(9,43,10,30),waterfallMat,s*27,-15,-9));
   curtain.rotation.y=s*.30;
  }
  moving.push(waterfallMat);
  scene.add(g);groups.push(g);
 }
 function buildHouseOfTheWord(){
  const zone=biomes[6],g=new THREE.Group(),y=heightAt(zone.x,zone.z);
  g.position.set(zone.x,y,zone.z);
  // Ivory basilica: layered hall, Gothic arches, gilded light.
  add(g,mesh(new THREE.BoxGeometry(46,15,24),stone,0,7.5,-4));
  add(g,mesh(new THREE.BoxGeometry(49,.55,26),ivory,0,15.25,-4));
  add(g,mesh(new THREE.BoxGeometry(46,.3,24),gold,0,16,-4));
  for(let i=0;i<5;i++){
   const x=(i-2)*9;
   arch(g,x,0.25,8.1,7.1,9.2);
   // translucent amber arched windows instead of dark blank walls
   const win=add(g,mesh(new THREE.PlaneGeometry(4.7,8.4),glass,x,6.5,8.17));
   const mullion=add(g,mesh(new THREE.BoxGeometry(.13,8,.16),gold,x,6.7,8.27));
  }
  for(let s of [-1,1]){
   tower(g,s*23,1,-1,3,21);
   tower(g,s*18,15.9,-7,1.9,8);
  }
  dome(g,0,16.15,-7,9,3.1);
  add(g,mesh(new THREE.BoxGeometry(49,2,34),shade,0,-1,0));
  for(let i=0;i<9;i++){
   const z=18-i*1.8;
   add(g,mesh(new THREE.BoxGeometry(18,.26,1.65),stone,0,.10-i*.05,z));
  }
  scene.add(g);groups.push(g);
 }
 function buildTestimonyGazebo(){
  const zone=biomes[4],g=new THREE.Group();
  g.position.set(zone.x,heightAt(zone.x,zone.z),zone.z);
  const step=new THREE.Mesh(new THREE.CylinderGeometry(10.5,11.5,1,14),stone);
  step.position.set(0,.5,0);g.add(step);
  for(let i=0;i<10;i++){
   const a=i*TAU/10;
   standingColumn(g,Math.sin(a)*9,1,Math.cos(a)*9,9.0);
  }
  const roof=new THREE.Mesh(new THREE.CylinderGeometry(10.5,10.5,.48,20),ivory);
  roof.position.y=10.7;g.add(roof);
  const crown=new THREE.Mesh(new THREE.SphereGeometry(6.7,26,14,0,TAU,0,P/2),glass);
  crown.position.y=10.95;g.add(crown);
  scene.add(g);groups.push(g);
 }
 function buildAllianceThreads(){
  // These golden filaments are purely atmospheric decoration, NOT private alliances.
  const area=biomes[3],g=new THREE.Group(),lineMat=new THREE.LineBasicMaterial({color:'#e5cc9c',transparent:true,opacity:.6});
  g.position.set(area.x,0,area.z);
  for(let i=0;i<23;i++){
   const a=i*2.39996,rad=16+5*Math.sqrt(i);
   const start=new THREE.Vector3(Math.cos(a)*rad,heightAt(area.x+Math.cos(a)*rad,area.z+Math.sin(a)*rad)+10+Math.sin(i),Math.sin(a)*rad);
   const end=new THREE.Vector3(Math.cos(a+1.9)*rad,heightAt(area.x+Math.cos(a+1.9)*rad,area.z+Math.sin(a+1.9)*rad)+9+Math.cos(i),Math.sin(a+1.9)*rad);
   const mid=start.clone().add(end).multiplyScalar(.5);mid.y-=2+r()*3;
   const curve=new THREE.QuadraticBezierCurve3(start,mid,end);
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(28)),lineMat);
   g.add(line);
  }
  scene.add(g);groups.push(g);
 }
 function buildFloatingIslands(){
  const floating=new THREE.Group(),rock=new THREE.MeshStandardMaterial({color:'#708578',roughness:1,flatShading:true});
  const moss=new THREE.MeshStandardMaterial({color:'#8fba80',roughness:1});
  const islands=[
    [-220,95,-315,24], [183,128,-346,31],[-165,119,-410,21],[218,105,-290,18]
  ];
  for(let [x,y,z,radius]of islands){
   const root=new THREE.Group();root.position.set(x,y,z);
   const cone=new THREE.Mesh(new THREE.ConeGeometry(radius,2.2*radius,11),rock);
   cone.rotation.z=P;cone.position.y=-radius*1.05;root.add(cone);
   const meadow=new THREE.Mesh(new THREE.CylinderGeometry(radius, radius*.86,3.2,18),moss);
   meadow.position.y=0;root.add(meadow);
   for(let i=0;i<6;i++){
    const a=i*TAU/6,x1=Math.cos(a)*radius*.72,z1=Math.sin(a)*radius*.72;
    const needle=mesh(new THREE.ConeGeometry(1.4+r()*1.5,5+r()*6,8),
      i%2?ivory:shade,x1,4,z1);
    root.add(needle);
   }
   const spire=mesh(new THREE.ConeGeometry(4,16,12),ivory,0,10,0);root.add(spire);
   const tip=mesh(new THREE.IcosahedronGeometry(1,1),glow,0,20,0);root.add(tip);
   floating.add(root);
  }
  scene.add(floating);groups.push(floating);
 }
 function buildDawnBridge(){
  const g=new THREE.Group(),x=44,z=118,y=heightAt(x,z);
  g.position.set(x,y,z);
  add(g,mesh(new THREE.BoxGeometry(24,.7,7.6),stone,0,.35,0));
  for(const s of [-1,1]){
   const rail=add(g,mesh(new THREE.BoxGeometry(24,.18,.26),gold,0,2.0,s*3.4));
   for(let i=0;i<10;i++){
    add(g,mesh(new THREE.CylinderGeometry(.12,.15,2.0,6),ivory,-10+i*2.25,1.0,s*3.4));
   }
  }
  scene.add(g);groups.push(g);
 }
 setTimeout(()=>{try{buildDawnBridge();buildTestimonyGazebo();}catch(e){console.error('ÉTERNEL architecture A',e);}},mobile?1750:850);
 setTimeout(()=>{try{buildMountainCitadel();buildHouseOfTheWord();}catch(e){console.error('ÉTERNEL architecture B',e);}},mobile?2800:1700);
 setTimeout(()=>{try{buildAllianceThreads();buildFloatingIslands();}catch(e){console.error('ÉTERNEL architecture C',e);}},mobile?4000:2600);
 return {
  update(now){for(const m of moving)m.uniforms.time.value=now*.001;},
  destroy(){for(const g of groups)scene.remove(g);}
 };
}
