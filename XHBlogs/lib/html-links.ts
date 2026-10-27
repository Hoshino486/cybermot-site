/**
 * 让正文里的站外链接在新窗口打开，站内相对链接保持原样。
 * remark 渲染出来的是裸 <a href="https://...">，这里统一补 target/rel。
 */
export function openExternalInNewTab(html: string): string {
  return html.replace(
    /<a href="(https?:\/\/[^"]+)">/g,
    (_match, href: string) => `<a href="${href}" target="_blank" rel="noopener noreferrer">`,
  );
}
