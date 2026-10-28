import type { Metadata } from 'next';
import './tool-shell.css';

export const metadata: Metadata = {
  title: 'CS2 SoundEvent Generator',
  description:
    '在浏览器里可视化编辑 Counter-Strike 2 的 SoundEvent（KV3），支持预设、曲线、批量生成与 .vsndevts 导出，配置只保存在本地。',
};

export default function SoundEventToolPage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-[#0B0F17]">
      <iframe
        src="/tools/soundevent/index.html"
        title="CS2 SoundEvent Generator"
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
      />
    </main>
  );
}
