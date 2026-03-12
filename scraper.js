const cheerio = require('cheerio');

const BASE_URL = 'https://v6.voiranime.com';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': BASE_URL,
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Cache-Control': 'max-age=0',
};

async function fetchPage(url) {
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function getLatestAnimes(page = 1) {
  try {
    const url = page > 1 ? `${BASE_URL}/page/${page}/` : `${BASE_URL}/`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const animes = [];

    // Try multiple selectors for the anime cards
    const selectors = [
      '.items .item',
      '.anime-list .item', 
      '.last_episodes .item',
      'article.item',
      '.widget-body .item',
      '.movies-list .item',
    ];

    let found = false;
    for (const sel of selectors) {
      if ($(sel).length > 0) {
        $(sel).each((i, el) => {
          const $el = $(el);
          const title = $el.find('.data h3, .name, h3, .title').first().text().trim();
          const link = $el.find('a').first().attr('href');
          const img = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
          const episode = $el.find('.episode, .eps, .epx, span.episode').first().text().trim();
          const type = $el.find('.quality, .type, .calidad').first().text().trim();

          if (title && link) {
            animes.push({ title, link, img: img || '', episode, type, id: slugify(link) });
          }
        });
        if (animes.length > 0) { found = true; break; }
      }
    }

    // Fallback: grab all anchor tags with images
    if (!found || animes.length === 0) {
      $('a').each((i, el) => {
        const $el = $(el);
        const img = $el.find('img').first();
        const title = img.attr('alt') || $el.attr('title') || '';
        const link = $el.attr('href') || '';
        const src = img.attr('src') || img.attr('data-src') || '';

        if (title && link && src && link.includes(BASE_URL) && !animes.find(a => a.link === link)) {
          animes.push({ title, link, img: src, episode: '', type: '', id: slugify(link) });
        }
      });
    }

    return { animes: animes.slice(0, 30), page };
  } catch (err) {
    console.error('getLatestAnimes error:', err.message);
    return { animes: [], page, error: err.message };
  }
}

async function searchAnimes(query, page = 1) {
  try {
    const url = `${BASE_URL}/?s=${encodeURIComponent(query)}&page=${page}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const animes = [];

    const selectors = ['.result-item', '.item', 'article', '.search-results .item'];
    for (const sel of selectors) {
      if ($(sel).length > 0) {
        $(sel).each((i, el) => {
          const $el = $(el);
          const title = $el.find('h3, h2, .title, .name').first().text().trim();
          const link = $el.find('a').first().attr('href') || '';
          const img = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';
          const desc = $el.find('p, .text, .description').first().text().trim();

          if (title && link) {
            animes.push({ title, link, img, desc: desc.slice(0, 200), id: slugify(link) });
          }
        });
        if (animes.length > 0) break;
      }
    }

    return { animes, query, page };
  } catch (err) {
    console.error('searchAnimes error:', err.message);
    return { animes: [], query, page, error: err.message };
  }
}

async function getAnimeDetail(animeUrl) {
  try {
    const url = animeUrl.startsWith('http') ? animeUrl : `${BASE_URL}${animeUrl}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const title = $('h1, .title, .sheader h2').first().text().trim();
    const img = $('.poster img, .sheader img, .cover img').first().attr('src') 
              || $('.poster img, .sheader img').first().attr('data-src') || '';
    const synopsis = $('.wp-content p, .description p, .synopsis p, #info p').first().text().trim();
    
    const genres = [];
    $('.genres a, .category a, .sgeneros a').each((i, el) => {
      genres.push($(el).text().trim());
    });

    const episodes = [];
    const epSelectors = ['#episodes .item', '.episodios li', '.episodes li', '.episodio', '#episodios li'];
    
    for (const sel of epSelectors) {
      if ($(sel).length > 0) {
        $(sel).each((i, el) => {
          const $el = $(el);
          const epTitle = $el.find('a, .epidata .epid').text().trim();
          const epLink = $el.find('a').first().attr('href') || '';
          const epNum = $el.find('.numerando, .num').text().trim();
          const epImg = $el.find('img').first().attr('src') || '';
          if (epLink) {
            episodes.push({ title: epTitle || `Épisode ${i+1}`, link: epLink, num: epNum || `${i+1}`, img: epImg, id: slugify(epLink) });
          }
        });
        if (episodes.length > 0) break;
      }
    }

    const info = {};
    $('.sinfo .custom_fields p, .extra span, .shead span').each((i, el) => {
      const text = $(el).text();
      const [key, ...val] = text.split(':');
      if (key && val.length) info[key.trim()] = val.join(':').trim();
    });

    return { title, img, synopsis, genres, episodes: episodes.reverse(), info, url };
  } catch (err) {
    console.error('getAnimeDetail error:', err.message);
    return { title: '', img: '', synopsis: '', genres: [], episodes: [], info: {}, error: err.message };
  }
}

async function getEpisodeStreams(episodeUrl) {
  try {
    const url = episodeUrl.startsWith('http') ? episodeUrl : `${BASE_URL}${episodeUrl}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const players = [];

    // Collect all iframes/embeds
    $('iframe, [data-src], embed').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (src && (src.includes('http') || src.startsWith('//'))) {
        const name = $(el).attr('name') || $(el).closest('[data-name]').attr('data-name') || `Player ${i+1}`;
        players.push({ name, src: src.startsWith('//') ? 'https:' + src : src, type: 'iframe' });
      }
    });

    // Look for download links
    const downloads = [];
    $('a[href*=".mp4"], a[href*="download"], a[href*="dl."], .dl-item a, .download-item a').each((i, el) => {
      const href = $(el).attr('href') || '';
      const label = $(el).text().trim() || $(el).closest('[data-quality]').attr('data-quality') || '';
      if (href) {
        const quality = extractQuality(label + ' ' + href);
        downloads.push({ label: label || quality || `HD ${i+1}`, href, quality });
      }
    });

    // Extract player options from JS
    const scripts = [];
    $('script').each((i, el) => {
      const src = $(el).attr('src');
      const content = $(el).html() || '';
      if (content.includes('player') || content.includes('source') || content.includes('file')) {
        scripts.push(content.slice(0, 2000));
      }
    });

    // Parse JSON-like sources from scripts
    scripts.forEach(script => {
      const matches = script.matchAll(/["']?file["']?\s*:\s*["']([^"']+\.m3u8[^"']*|[^"']+\.mp4[^"']*)["']/gi);
      for (const match of matches) {
        const src = match[1];
        if (src && !downloads.find(d => d.href === src)) {
          const quality = extractQuality(script + src);
          downloads.push({ label: quality || 'Direct', href: src, quality, direct: true });
        }
      }
    });

    // Tab-based players
    $('.playex, .player-tab, .tab-video, [data-post], [data-nume]').each((i, el) => {
      const name = $(el).text().trim() || $(el).attr('data-name') || `Lecteur ${i+1}`;
      const type = $(el).attr('data-type') || 'player';
      const post = $(el).attr('data-post') || '';
      const nume = $(el).attr('data-nume') || '';
      if (post || nume) {
        players.push({ name, post, nume, type, tabBased: true });
      }
    });

    const title = $('h1, .title').first().text().trim();
    const animeLink = $('a.tip, .breadcrumb a, nav a').eq(-2).attr('href') || '';

    return { players, downloads, title, animeLink, url };
  } catch (err) {
    console.error('getEpisodeStreams error:', err.message);
    return { players: [], downloads: [], title: '', animeLink: '', error: err.message };
  }
}

async function getCategories() {
  try {
    const html = await fetchPage(BASE_URL);
    const $ = cheerio.load(html);
    const cats = [];
    
    $('nav a, .menu a, #menu a, .nav-links a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href') || '';
      if (text && href && href.includes(BASE_URL) && text.length < 30) {
        cats.push({ label: text, href });
      }
    });

    return { categories: cats };
  } catch (err) {
    return { categories: [], error: err.message };
  }
}

function slugify(url) {
  return url.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').toLowerCase().slice(-60);
}

function extractQuality(text) {
  const q = ['2160p', '4K', '1080p', '720p', '480p', '360p', '240p'];
  for (const qp of q) {
    if (text.toLowerCase().includes(qp.toLowerCase())) return qp;
  }
  return '';
}

module.exports = { getLatestAnimes, searchAnimes, getAnimeDetail, getEpisodeStreams, getCategories, BASE_URL };
