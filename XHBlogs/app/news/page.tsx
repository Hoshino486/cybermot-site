import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import NewsBoard, { type HotTopic, type NewsItem } from '../../components/NewsBoard';
import { siteConfig } from '../../siteConfig';

export const metadata = {
  title: '新闻 | ' + siteConfig.title,
  description: '实时聚合的 AI 与全行业热点：模型、产品、行业、论文、教程与观点。',
};

// 两分钟重新取一次，页面本身是静态生成的，取数在边缘完成
export const revalidate = 120;

const API = 'https://aihot.news/api/v1';

async function grab<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(9000),
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function stamp(): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

export default async function NewsPage() {
  const [hot, feed] = await Promise.all([
    grab<{ items: HotTopic[] }>(`${API}/hot-topics`),
    grab<{ items: NewsItem[] }>(`${API}/items?limit=60&window=7d`),
  ]);

  const hotTopics = hot?.items ?? [];
  const items = feed?.items ?? [];

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <NewsBoard hotTopics={hotTopics} items={items} updatedAt={stamp()} live={Boolean(feed || hot)} />
      </PageTransition>
    </div>
  );
}
