export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const targetUrl = decodeURIComponent(url);
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://v6.voiranime.com/',
        'Origin': 'https://v6.voiranime.com',
      },
    });

    const contentType = response.headers.get('content-type') || 'text/plain';
    
    // For M3U8 playlists, rewrite segment URLs
    if (contentType.includes('mpegurl') || targetUrl.endsWith('.m3u8')) {
      const text = await response.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      const rewritten = text.replace(/^(?!#)(.+)$/gm, (line) => {
        if (line.startsWith('http')) return `/api/proxy?url=${encodeURIComponent(line)}`;
        if (line.startsWith('/')) return `/api/proxy?url=${encodeURIComponent(new URL(line, targetUrl).href)}`;
        return `/api/proxy?url=${encodeURIComponent(baseUrl + line)}`;
      });
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(rewritten);
    }

    // For TS segments and other binary content
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const config = {
  api: {
    responseLimit: '50mb',
  },
};
