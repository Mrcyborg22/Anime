const { searchAnimes } = require('../../lib/scraper');

export default async function handler(req, res) {
  const { q, page = 1 } = req.query;
  
  if (!q) return res.status(400).json({ error: 'Query required', animes: [] });
  
  try {
    const data = await searchAnimes(q, parseInt(page));
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message, animes: [] });
  }
}
