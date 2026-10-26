import fs from 'node:fs';
import path from 'node:path';
import {chromium} from '@playwright/test';
const out=path.resolve('../artifacts');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto('http://127.0.0.1:3000/');await page.waitForTimeout(1100);await page.screenshot({path:path.join(out,'revision-home-desktop.png')});
 await page.goto('http://127.0.0.1:3000/settings');await page.screenshot({path:path.join(out,'revision-settings.png'),fullPage:true});
 await page.goto('http://127.0.0.1:3000/drafts');await page.getByRole('button',{name:'新建草稿',exact:true}).click();await page.getByRole('textbox',{name:'草稿标题'}).fill('把灵感，留在这里');await page.getByRole('textbox',{name:'Markdown 正文'}).fill('## 一个新的开始\n\n写下那些不想忘记的瞬间。');await page.waitForTimeout(500);await page.screenshot({path:path.join(out,'revision-drafts.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:3000/');await page.waitForTimeout(600);await page.screenshot({path:path.join(out,'revision-home-mobile.png'),fullPage:true});await page.getByRole('button',{name:'打开导航菜单'}).click();await page.screenshot({path:path.join(out,'revision-mobile-menu.png')});
 const sizes=[];for(const width of [360,390,768,1024,1180,1280,1440,1920]){await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:3000/settings');sizes.push({width,scroll:await page.evaluate(()=>document.documentElement.scrollWidth),nav:await page.locator('.cm-nav').isVisible()});}
 fs.writeFileSync(path.join(out,'revision-responsive.json'),JSON.stringify(sizes,null,2));console.log(JSON.stringify(sizes));console.log('Screenshots captured.');
}finally{await browser.close();}

