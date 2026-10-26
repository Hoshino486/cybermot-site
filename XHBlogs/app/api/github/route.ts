// The old Gitalk OAuth proxy is retired. giscus manages its own authorization.
export const runtime = 'nodejs';

export async function POST() {
  return Response.json(
    { error: 'Legacy OAuth endpoint disabled. Comments use giscus.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
