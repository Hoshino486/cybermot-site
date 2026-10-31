import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import NewsBoard from '../../components/NewsBoard';
import { fetchAllNews } from '../../lib/news';
import { siteConfig } from '../../siteConfig';

export const metadata = {
  title: '新闻 | ' + siteConfig.title,
  description: '实时聚合的 AI 与全行业热点：模型、产品、行业、论文、教程、科技与中文社区。',
};

// 两分钟重新取一次；页面走 ISR，过期后由边缘重新生成
export const revalidate = 120;

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
  const { items, hot } = await fetchAllNews();

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <NewsBoard hotTopics={hot} items={items} updatedAt={stamp()} live={items.length > 0} />
      </PageTransition>
    </div>
  );
}
