"use client";

import CommentsEmbed from './CommentsEmbed';

export default function LabComments({ pageId }: { pageId?: string }) {
  return <CommentsEmbed pageId={pageId ? `workshop:${pageId}` : undefined} />;
}
