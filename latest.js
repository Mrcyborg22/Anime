const { getLatestAnimes } = require('../../lib/scraper');

export default async function handler(req, res) {
  const { page = 1 } = req.query;
  
  try {
    const data = await getLatestAnimes(parseInt(page));
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message, animes: [] });
  }
}
