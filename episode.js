const { getEpisodeStreams } = require('../../lib/scraper');

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });
  
  try {
    const data = await getEpisodeStreams(decodeURIComponent(url));
    res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
