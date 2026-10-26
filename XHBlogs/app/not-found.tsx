import Link from 'next/link';
export default function NotFound() { return <main className="not-found"><span>404 / LOST IN SPACE</span><h1>这一页，暂时迷路了。</h1><p>也许故事还没有开始，也许它已经搬去了新的地方。</p><Link href="/" className="primary-action">返回首页 ↗</Link></main>; }
