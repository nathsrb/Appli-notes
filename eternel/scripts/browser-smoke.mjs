import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium,devices} from 'playwright';
const base='http://127.0.0.1:3000';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn('node',['server.mjs'],{cwd:process.cwd(),stdio:'inherit',env:{...process.env,PORT:'3000'}});
async function ready(){
 for(let i=0;i<75;i++){
  try{const r=await fetch(base+'/health',{signal:AbortSignal.timeout(2000)});if(r.ok)return;}catch{}
  await sleep(500);
 }
 throw Error('The application did not start on port 3000');
}
let browser;
try{
 await ready();await mkdir('qa',{recursive:true});
 browser=await chromium.launch({
  headless:true,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage']
 });
 const desktop=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[];
 desktop.on('pageerror',e=>errors.push('desktop: '+e.message));
 await desktop.goto(base,{waitUntil:'domcontentloaded',timeout:50000});
 await desktop.locator('#enter').waitFor({state:'visible',timeout:45000});
 await desktop.locator('#enter').click();
 await desktop.locator('#playerInfo').waitFor({state:'visible',timeout:30000});
 await desktop.waitForTimeout(1400);
 await desktop.keyboard.down('z');
 await desktop.waitForTimeout(1900);
 await desktop.keyboard.up('z');
 const travel=await desktop.locator('#walkedMeters').innerText();
 console.log('DESKTOP walking distance:',travel);
 assert.ok(parseInt(travel)>0,'Z must move the explorer');
 await desktop.screenshot({path:'qa/desktop-jungle.png',fullPage:true,timeout:30000});
 await desktop.locator('#cameraButton').click();
 assert.match(await desktop.locator('#cameraModeLabel').innerText(),/1ʳᵉ/);
 await desktop.locator('#cameraButton').click();
 await desktop.locator('#openMap').click();
 await desktop.locator('#mapList button').first().waitFor({state:'visible',timeout:20000});
 await desktop.locator('#closeMap').click();
 console.log('DESKTOP PASS: forward, camera, map and HUD');
 const mobileContext=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844}});
 const mobile=await mobileContext.newPage();
 mobile.on('pageerror',e=>errors.push('mobile: '+e.message));
 await mobile.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
 await mobile.locator('#enter').waitFor({state:'visible',timeout:45000});
 await mobile.locator('#enter').click();
 await mobile.locator('#joystick').waitFor({state:'visible',timeout:30000});
 const joy=await mobile.locator('#joystick').boundingBox();
 assert.ok(joy,'joystick must be available');
 const cx=joy.x+joy.width/2,cy=joy.y+joy.height/2;
 await mobile.mouse.move(cx,cy);await mobile.mouse.down();
 await mobile.mouse.move(cx,cy-33,{steps:4});await mobile.waitForTimeout(1800);await mobile.mouse.up();
 const mobileTravel=await mobile.locator('#walkedMeters').innerText();
 console.log('MOBILE joystick travel:',mobileTravel);
 assert.ok(parseInt(mobileTravel)>0,'Mobile joystick must move');
 await mobile.screenshot({path:'qa/mobile-jungle.png',fullPage:true,timeout:30000});
 const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
 assert.ok(!overflow,'No horizontal overflow on iPhone');
 console.log('MOBILE PASS: joystick, viewport and camera UI');
 if(errors.length)throw Error('Browser runtime errors:\n'+errors.join('\n'));
 console.log('ÉTERNEL Browser QA: PASS');
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
