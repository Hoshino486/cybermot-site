import { chromium } from '@playwright/test';
const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
try {
await page.goto((process.env.TEST_BASE_URL || 'http://127.0.0.1:3000') + '/music',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>{const a=document.querySelector('audio');return a&&!a.paused&&a.currentTime>1},{},{timeout:60000});
const initial=await page.locator('audio').evaluate(a=>{a.dataset.identity='music-check';return {paused:a.paused,time:a.currentTime,duration:a.duration,src:a.currentSrc}});
await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'关于',exact:false}).click();
await page.waitForURL('**/about');
await page.waitForTimeout(1200);
const route=await page.locator('audio').evaluate(a=>({paused:a.paused,time:a.currentTime,same:a.dataset.identity==='music-check'}));
await page.getByRole('button',{name:'暂停音乐',exact:true}).click();await page.locator('h1').click();
const paused=await page.locator('audio').evaluate(a=>({paused:a.paused,time:a.currentTime}));
await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(2500);
const reload=await page.locator('audio').evaluate(a=>({paused:a.paused,time:a.currentTime}));
await page.getByRole('button',{name:'播放音乐',exact:true}).click();await page.waitForTimeout(1500);
const resumed=await page.locator('audio').evaluate(a=>({paused:a.paused,time:a.currentTime}));
console.log(JSON.stringify({initial,route,paused,reload,resumed,errors},null,2));
if(!route.same||route.paused||!paused.paused||!reload.paused||resumed.paused||errors.length)process.exitCode=1;
}finally{await browser.close();}
