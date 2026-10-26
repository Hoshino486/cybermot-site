"use client";

import CommentsEmbed from './CommentsEmbed';

export default function MomentComments({ id }: { id: string }) {
  return <CommentsEmbed pageId={`moment:${id}`} compact />;
}
