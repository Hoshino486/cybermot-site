import {test,expect} from '@playwright/test';
test('autoplay rejection resumes with a general page gesture and manual pause stays paused',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLMediaElement.prototype.play;let blocked=true;HTMLMediaElement.prototype.play=function(){if(this.tagName==='AUDIO'&&blocked){blocked=false;return Promise.reject(new DOMException('Autoplay requires a user gesture','NotAllowedError'));}return original.call(this);};});
 await page.goto('/about');await expect(page.locator('[data-music-status]')).toHaveAttribute('data-music-status','blocked',{timeout:30000});await page.locator('h1').click();await expect.poll(()=>page.locator('audio').evaluate((a:HTMLAudioElement)=>!a.paused&&a.currentTime>.2),{timeout:30000}).toBe(true);await page.getByRole('button',{name:'暂停音乐',exact:true}).click();await page.locator('h1').click();expect(await page.locator('audio').evaluate((a:HTMLAudioElement)=>a.paused)).toBe(true);
});
test('music preferences persist volume and expanded playlist keeps the current audio',async({page})=>{
 await page.goto('/settings');await page.locator('#settings-volume').fill('0.27');await page.reload();await expect(page.locator('#settings-volume')).toHaveValue('0.27');await page.getByRole('button',{name:'展开音乐歌单',exact:true}).click();await expect(page.locator('#cm-playlist')).toBeVisible();await page.locator('audio').evaluate((a:HTMLAudioElement)=>a.dataset.check='persist');await page.getByRole('button',{name:'收起歌单，继续播放',exact:true}).click();expect(await page.locator('audio').evaluate((a:HTMLAudioElement)=>a.dataset.check)).toBe('persist');await expect(page.locator('#cm-playlist')).toHaveCount(0);
});

