import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 引入前台客户端组件
import CreativeWorkshopClient from './CreativeWorkshopClient';

// Markdown is consumed during prerendering, not read from the Worker filesystem.
function getLocalItems(directoryName: 'posts' | 'chatters' | 'moments', typeName: string) {
  const dirPath = path.join(/* turbopackIgnore: true */ process.cwd(), directoryName);
  let items: any[] = [];
  try {
    if (fs.existsSync(/* turbopackIgnore: true */ dirPath)) {
      const fileNames = fs.readdirSync(/* turbopackIgnore: true */ dirPath).filter(f => f.endsWith('.md'));
      items = fileNames.flatMap(fileName => {
        const fullPath = path.join(/* turbopackIgnore: true */ dirPath, fileName);
        // 🌟 核心：把 content（正文内容）和 data（头部参数）解构出来！
        const { data, content } = matter(fs.readFileSync(/* turbopackIgnore: true */ fullPath, 'utf8'));
        if (data.draft === true || data.published === false) return [];

        // 提取真正的文件名作为路由 slug
        const realSlug = fileName.replace(/\.md$/, '');

        return [{
          id: data.id || realSlug,
          slug: realSlug, // 🌟 强制保留真实的 slug 供路由跳转使用
          title: data.title || '',
          type: typeName,
          date: data.date || '2026-05-01',
          // 🌟 核心修复：把 cover（封面图）提取出来传给前台！如果写的是 image 也兼容
          cover: data.cover || data.image || null,
          // 把正文传给前台，去掉可能存在的换行符，限制长度防止卡片撑爆
          content: content.trim()
        }];
      });
    }
  } catch (error) {
    console.error(`读取 ${directoryName} 失败:`, error);
  }
  return items;
}

export default function CreativeWorkshopPage() {
  const posts = getLocalItems('posts', 'post');
  const chatters = getLocalItems('chatters', 'chatter');
  const moments = getLocalItems('moments', 'moment');

  return (
    <CreativeWorkshopClient
      posts={posts}
      chatters={chatters}
      moments={moments}
    />
  );
}
