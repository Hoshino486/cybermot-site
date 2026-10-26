import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import ChatterBoard from './ChatterBoard';
import { siteConfig } from '@/siteConfig';


export const metadata = {
  title: "杂谈 | "+ siteConfig.title,
  description: "日常碎片与灵感记录",
};

export default function ChatterPage() {
  // 注意：这里我们假设你的 md 文件放在根目录的 chatters 文件夹里
  const chattersDirectory = path.join(process.cwd(), 'chatters');
  let chatters: Parameters<typeof ChatterBoard>[0]['chatters'] = [];

  try {
    const fileNames = fs.existsSync(chattersDirectory)
      ? fs.readdirSync(chattersDirectory).filter(fileName => fileName.endsWith('.md'))
      : [];

    chatters = fileNames.flatMap(fileName => {
      const slug = fileName.replace(/\.md$/, '');
      const fileContents = fs.readFileSync(path.join(chattersDirectory, fileName), 'utf8');
      const { data, content } = matter(fileContents);
      if (data.draft === true || data.published === false) return [];

      return [{
        slug,
        title: typeof data.title === 'string' ? data.title : slug,
        date: data.date ? String(data.date) : '',
        tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [],
        mood: typeof data.mood === 'string' ? data.mood : '',
        cover: typeof data.cover === 'string' && data.cover ? data.cover : siteConfig.defaultPostCover,
        content: content.replace(/^#+ .*\n/m, '') // 去除开头的 markdown 标题以优化截取显示
      }];
    }).sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
  } catch (e) {
    console.error("读取杂谈文件失败:", e);
  }

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        {/* 将解析好的数据传递给客户端组件进行瀑布流渲染 */}
        <ChatterBoard chatters={chatters} />
      </PageTransition>
    </div>
  );
}
