import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // Try to get the requested asset
      const asset = await getAssetFromKV(request, {
        ASSETS: env.ASSETS,
        mapRequestToAsset,
        cacheControl: {
          default: 'max-age=3600',
          'text/html': 'must-revalidate'
        }
      });
      return asset;
    } catch (e) {
      // If asset not found and it's a SPA route (no file extension), serve index.html
      if (!pathname.includes('.') && pathname !== '/favicon.ico') {
        try {
          return await getAssetFromKV(
            new Request(new URL('/index.html', url).toString(), request),
            {
              ASSETS: env.ASSETS,
              mapRequestToAsset,
              cacheControl: { 'text/html': 'must-revalidate' }
            }
          );
        } catch (indexError) {
          console.error('Failed to serve index.html:', indexError);
        }
      }

      return new Response('Not found', { status: 404 });
    }
  }
};








