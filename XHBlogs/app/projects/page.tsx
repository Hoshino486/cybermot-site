import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import ProjectsBoard from './ProjectsBoard';
import TrendingBoard from '../../components/TrendingBoard';
import { fetchTrending } from '../../lib/github-trending';
import {siteConfig} from "@/siteConfig";

export const metadata = {
  title: "项目矩阵 | " + siteConfig.title,
  description: "开源项目与代码仓库展示，附 GitHub 实时热门榜",
};

// 每次请求实时取，构建时预渲染的静态页在 Worker 上不会自动刷新
export const dynamic = 'force-dynamic';

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

export default async function ProjectsPage() {
  const trending = await fetchTrending();

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="mt-28">
          <ProjectsBoard />
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-10 pb-6">
            <TrendingBoard data={trending} updatedAt={stamp()} />
          </div>
        </div>
      </PageTransition>
    </div>
  );
}