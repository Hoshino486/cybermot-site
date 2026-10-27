/**
 * wrangler deploy 的带重试包装。
 *
 * Workers Builds 里偶尔会在 assets-upload-session 这一步返回
 * "An unknown error has occurred"，同一份内容重试就能过，
 * 所以在部署入口外面套几层重试，别让一次抖动把整次构建判死。
 */
import { spawnSync } from 'node:child_process';

const ATTEMPTS = Number(process.env.DEPLOY_ATTEMPTS || 3);
const DELAY_MS = Number(process.env.DEPLOY_RETRY_DELAY_MS || 6000);

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  console.log(`[deploy] 第 ${attempt}/${ATTEMPTS} 次尝试：npx wrangler deploy`);
  const result = spawnSync('npx', ['wrangler', 'deploy'], { stdio: 'inherit', shell: true });
  if (result.status === 0) {
    console.log('[deploy] 成功');
    process.exit(0);
  }
  console.log(`[deploy] 失败（退出码 ${result.status}）`);
  if (attempt < ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }
}

console.error('[deploy] 全部尝试失败');
process.exit(1);
