/**
 * ÉTERNEL original natural soundscape, synthesized with WebAudio.
 * No external audio file, music, autoplay or user data.
 * Call only from an explicit click on the sound button.
 */
export async function startGardenAudio(){
 const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
 if(!Context)throw Error('AudioContext is unavailable');
 const context=new Context();
 await context.resume();
 const master=context.createGain();master.gain.value=.16;
 master.connect(context.destination);
 const sampleRate=context.sampleRate;
 let x=7919;
 const random=()=>{x=(x*16807)%2147483647;return x/2147483647;};
 const soundBuffer=(seconds,color='pink')=>{
  const len=Math.ceil(sampleRate*seconds);
  const buffer=context.createBuffer(1,len,sampleRate);
  const data=buffer.getChannelData(0);
  let pink=0;
  for(let i=0;i<len;i++){
    const w=random()*2-1;
    pink=(pink+w*.032)/1.032;
    data[i]=color==='wind'?pink*.6:color==='water'?w*.18+pink*.12:w*.25;
  }
  return buffer;
 };
 const layers=[];
 const layer=(color,cutoff,gainAmount,filterType='lowpass')=>{
  const node=context.createBufferSource();node.buffer=soundBuffer(3,color);node.loop=true;
  const filter=context.createBiquadFilter();filter.type=filterType;filter.frequency.value=cutoff;
  const gain=context.createGain();gain.gain.value=gainAmount;
  node.connect(filter);filter.connect(gain);gain.connect(master);node.start();
  layers.push({node,filter,gain});return gain;
 };
 const wind=layer('wind',530,.24);
 const brook=layer('water',1600,.12,'bandpass');
 const leaves=layer('pink',5800,.024,'highpass');
 const timers=[];
 const chirp=(now,f0,f1,duration,vol)=>{
  const oscillator=context.createOscillator();
  const gain=context.createGain();
  oscillator.type='sine';
  oscillator.frequency.setValueAtTime(f0,now);
  oscillator.frequency.exponentialRampToValueAtTime(f1,now+duration);
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(vol,now+duration*.25);
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  oscillator.connect(gain);gain.connect(master);
  oscillator.start(now);oscillator.stop(now+duration+.02);
 };
 const startBird=()=>{
  if(context.state!=='running')return;
  const t=context.currentTime+.05;
  const root=850+random()*800, duration=.10+random()*.13;
  chirp(t,root,root*(1.25+random()*.3),duration,.019);
  chirp(t+.21,root*1.2,root*.8,duration*.75,.013);
  if(random()>.5)chirp(t+.40,root*.84,root*1.38,duration*.65,.009);
 };
 const birdTimer=setInterval(startBird,1900+Math.floor(random()*1800));
 timers.push(birdTimer);
 const cricketTimer=setInterval(()=>{
  if(context.state!=='running')return;
  const t=context.currentTime+.03;
  chirp(t,4400,3900,.07,.0028);chirp(t+.1,4500,4070,.07,.0026);
 },5100);
 timers.push(cricketTimer);
 let stopped=false;
 return {
  async stop(){
   if(stopped)return;stopped=true;
   timers.forEach(clearInterval);
   for(const l of layers){try{l.node.stop();}catch{}}
   await context.close();
  },
  setBiome(id){
   const wave=id==='central'||id==='aube'||id==='temoignages';
   const forest=id==='alliances';
   const mountain=id==='mont';
   const t=context.currentTime;
   wind.gain.setTargetAtTime(mountain?.31:forest?.26:.20,t,2);
   brook.gain.setTargetAtTime(wave?.18:mountain?.12:.065,t,2);
   leaves.gain.setTargetAtTime(forest?.05:.021,t,2);
  }
 };
}
