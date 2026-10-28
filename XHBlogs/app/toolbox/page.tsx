import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import ToolsBoard from './ToolsBoard';
import { siteConfig } from '@/siteConfig';

export const metadata = {
  title: '工具箱 | ' + siteConfig.title,
  description: '不用装软件，打开浏览器就能用的在线工具。',
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="mt-28">
          <ToolsBoard />
        </div>
      </PageTransition>
    </div>
  );
}
