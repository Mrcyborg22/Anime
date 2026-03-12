import Head from 'next/head'
import { useState, useEffect, useCallback, useRef } from 'react'

// ──────────────── ANIME CARD ────────────────
function AnimeCard({ anime, onClick, delay = 0 }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <div
      className="anime-card"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onClick(anime)}
    >
      <div className="card-img-wrap">
        {anime.img && !imgErr ? (
          <img
            src={anime.img}
            alt={anime.title}
            className="card-img"
            onError={() => setImgErr(true)}
            loading="lazy"
          />
        ) : (
          <div className="card-img-placeholder">🎌</div>
        )}
        <div className="card-overlay">
          <button className="card-play">▶</button>
        </div>
        {anime.type && <span className="card-badge">{anime.type}</span>}
        {anime.episode && <span className="card-ep-badge">{anime.episode}</span>}
      </div>
      <div className="card-body">
        <p className="card-title">{anime.title}</p>
      </div>
    </div>
  )
}

// ──────────────── ANIME DETAIL MODAL ────────────────
function AnimeModal({ animeUrl, onClose, onPlayEpisode }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!animeUrl) return
    setLoading(true)
    setData(null)
    fetch(`/api/anime?url=${encodeURIComponent(animeUrl)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [animeUrl])

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{data?.title || 'Chargement...'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading && <div className="loader"><div className="spinner" /><span>CHARGEMENT DES DONNÉES...</span></div>}

        {!loading && data && (
          <>
            <div className="modal-body">
              <div className="modal-poster">
                {data.img ? (
                  <img src={data.img} alt={data.title} onError={(e) => e.target.style.display = 'none'} />
                ) : (
                  <div style={{ textAlign: 'center', fontSize: 64, padding: 20 }}>🎌</div>
                )}
              </div>
              <div className="modal-info">
                {data.synopsis && (
                  <p className="modal-synopsis">{data.synopsis}</p>
                )}
                {data.genres?.length > 0 && (
                  <div className="genre-tags">
                    {data.genres.map((g, i) => <span key={i} className="genre-tag">{g}</span>)}
                  </div>
                )}
                {Object.keys(data.info || {}).length > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8 }}>
                    {Object.entries(data.info).slice(0, 6).map(([k, v]) => (
                      <div key={k}><span style={{ color: 'var(--cyan)', fontFamily: 'Share Tech Mono' }}>{k}:</span> {v}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {data.episodes?.length > 0 && (
              <div className="episodes-section">
                <div className="episodes-title">ÉPISODES [{data.episodes.length}]</div>
                <div className="episodes-grid">
                  {data.episodes.map((ep, i) => (
                    <button
                      key={i}
                      className="ep-btn"
                      onClick={() => onPlayEpisode(ep, data.title)}
                      title={ep.title}
                    >
                      {ep.num || ep.title?.replace(/[^0-9]/g, '') || `EP ${i + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(!data.episodes || data.episodes.length === 0) && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'Share Tech Mono', fontSize: 13 }}>
                Ouvrir sur la source →{' '}
                <a href={animeUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)' }}>voiranime.com</a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ──────────────── PLAYER MODAL ────────────────
function PlayerModal({ episode, animeTitle, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePlayer, setActivePlayer] = useState(0)

  useEffect(() => {
    if (!episode?.link) return
    setLoading(true)
    setData(null)
    fetch(`/api/episode?url=${encodeURIComponent(episode.link)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [episode?.link])

  const allPlayers = data?.players || []
  const downloads = data?.downloads || []

  return (
    <div className="player-modal-bg">
      <div className="player-container">
        <div className="player-header">
          <button className="player-back" onClick={onBack}>← RETOUR</button>
          <div className="player-title">
            {animeTitle} — {episode.title || `EP ${episode.num}`}
          </div>
        </div>

        {loading && <div className="loader"><div className="spinner" /><span>CHARGEMENT DU LECTEUR...</span></div>}

        {!loading && allPlayers.length > 0 && (
          <>
            {allPlayers.length > 1 && (
              <div className="player-tabs">
                {allPlayers.map((p, i) => (
                  <button
                    key={i}
                    className={`player-tab${activePlayer === i ? ' active' : ''}`}
                    onClick={() => setActivePlayer(i)}
                  >
                    {p.name || `Lecteur ${i + 1}`}
                  </button>
                ))}
              </div>
            )}

            <div className="video-frame-wrap">
              {allPlayers[activePlayer]?.src && (
                <iframe
                  src={allPlayers[activePlayer].src}
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture"
                  title={episode.title}
                />
              )}
            </div>
          </>
        )}

        {!loading && allPlayers.length === 0 && (
          <div style={{ background: '#000', borderRadius: 6, border: '1px solid rgba(0,245,255,0.2)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 48 }}>📺</span>
            <p style={{ color: 'var(--text-dim)', fontFamily: 'Share Tech Mono', fontSize: 13 }}>Lecteur non disponible directement</p>
            <a href={episode.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)', fontFamily: 'Share Tech Mono', fontSize: 13 }}>
              → Ouvrir sur voiranime.com
            </a>
          </div>
        )}

        {downloads.length > 0 && (
          <div className="download-section">
            <div className="download-title">⬇ TÉLÉCHARGEMENT</div>
            <div className="download-links">
              {downloads.map((dl, i) => (
                <a
                  key={i}
                  href={dl.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dl-link"
                  download
                >
                  ⬇ {dl.quality || dl.label || `HD ${i + 1}`}
                </a>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <a href={episode.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', fontFamily: 'Share Tech Mono', fontSize: 12 }}>
            Ouvrir sur voiranime.com ↗
          </a>
        </div>
      </div>
    </div>
  )
}

// ──────────────── MAIN PAGE ────────────────
export default function Home() {
  const [view, setView] = useState('home') // home | search
  const [animes, setAnimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedAnime, setSelectedAnime] = useState(null)
  const [selectedEpisode, setSelectedEpisode] = useState(null)
  const [episodeAnimeTitle, setEpisodeAnimeTitle] = useState('')
  const searchRef = useRef()

  const fetchLatest = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/latest?page=${p}`)
      const data = await res.json()
      setAnimes(data.animes || [])
    } catch { }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLatest(page) }, [page])

  const handleSearch = async (q) => {
    if (!q?.trim()) return
    setView('search')
    setSearchLoading(true)
    setSearchResults([])
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.animes || [])
    } catch { }
    setSearchLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch(searchQuery)
  }

  const handleCardClick = (anime) => {
    setSelectedAnime(anime.link)
  }

  const handlePlayEpisode = (ep, title) => {
    setSelectedAnime(null)
    setEpisodeAnimeTitle(title)
    setSelectedEpisode(ep)
  }

  const displayList = view === 'search' ? searchResults : animes
  const isLoading = view === 'search' ? searchLoading : loading

  return (
    <>
      <Head>
        <title>Mr Cyborg Anime — Streaming & Téléchargement</title>
        <meta name="description" content="Mr Cyborg Anime - Regardez et téléchargez vos animés préférés en HD, Full HD, 4K sur tous vos appareils." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#00f5ff" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>" />
      </Head>

      {/* HEADER */}
      <header className="header">
        <a className="logo" onClick={() => { setView('home'); setSearchQuery('') }}>
          <span>MR</span> <span>CYBORG</span>
        </a>

        <div className="search-bar">
          <input
            ref={searchRef}
            type="text"
            placeholder="Rechercher un animé..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="search-btn" onClick={() => handleSearch(searchQuery)}>🔍</button>
        </div>

        <nav className="nav-links">
          <button className={`nav-btn${view === 'home' ? ' active' : ''}`} onClick={() => setView('home')}>Accueil</button>
          <button className="nav-btn" onClick={() => { setSearchQuery(''); searchRef.current?.focus() }}>Catégories</button>
        </nav>
      </header>

      {/* PLAYER MODAL */}
      {selectedEpisode && (
        <PlayerModal
          episode={selectedEpisode}
          animeTitle={episodeAnimeTitle}
          onBack={() => setSelectedEpisode(null)}
        />
      )}

      {/* ANIME DETAIL MODAL */}
      {selectedAnime && !selectedEpisode && (
        <AnimeModal
          animeUrl={selectedAnime}
          onClose={() => setSelectedAnime(null)}
          onPlayEpisode={handlePlayEpisode}
        />
      )}

      <main className="main">
        {/* HERO */}
        {view === 'home' && (
          <div className="hero">
            <h1 className="hero-title">
              <span className="line1">MR CYBORG</span>
              <span className="line2">ANIME</span>
              <span className="line3">STREAMING · GRATUIT · HD</span>
            </h1>
            <p className="hero-subtitle">// Tous les animés • Toutes les résolutions • Tous les appareils //</p>
          </div>
        )}

        {/* TICKER */}
        <div className="ticker">
          <div className="ticker-inner">
            {['Dragon Ball Z', 'Naruto', 'One Piece', 'Attack on Titan', 'Demon Slayer', 'Jujutsu Kaisen', 'My Hero Academia', 'Bleach', 'Death Note', 'Fullmetal Alchemist', 'Sword Art Online', 'Tokyo Ghoul'].flatMap(t => [
              <span key={t} className="ticker-item">▶ <span>{t}</span></span>,
              <span key={t + '2'} className="ticker-item">▶ <span>{t}</span></span>
            ])}
          </div>
        </div>

        {/* CONTENT */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">
              {view === 'search' ? `Résultats : "${searchQuery}"` : '// Derniers Épisodes'}
            </h2>
            <div className="section-line" />
            {isLoading && <div className="spinner" style={{ flexShrink: 0 }} />}
          </div>

          {isLoading && displayList.length === 0 && (
            <div className="loader">
              <div className="spinner" />
              <span>CHARGEMENT DES DONNÉES...</span>
            </div>
          )}

          {!isLoading && displayList.length === 0 && (
            <div className="empty">
              <span className="empty-icon">📡</span>
              <p>{view === 'search' ? 'Aucun résultat trouvé' : 'Aucun animé disponible'}</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Essayez de rafraîchir ou vérifiez votre connexion</p>
            </div>
          )}

          {displayList.length > 0 && (
            <div className="anime-grid">
              {displayList.map((anime, i) => (
                <AnimeCard
                  key={anime.id || anime.link || i}
                  anime={anime}
                  onClick={handleCardClick}
                  delay={Math.min(i * 40, 400)}
                />
              ))}
            </div>
          )}
        </div>

        {/* PAGINATION (home only) */}
        {view === 'home' && (
          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              ← PRÉC
            </button>
            {[...Array(5)].map((_, i) => {
              const p = Math.max(1, page - 2) + i
              return (
                <button
                  key={p}
                  className={`page-btn${p === page ? ' active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            })}
            <button className="page-btn" onClick={() => setPage(p => p + 1)}>
              SUIV →
            </button>
          </div>
        )}
      </main>

      <footer>
        <p>🤖 <span>MR CYBORG ANIME</span> — Streaming animé gratuit // Propulsé par <span>voiranime.com</span></p>
        <p style={{ marginTop: 6, fontSize: 11, opacity: 0.5 }}>Ce site agrège du contenu depuis des sources publiques. Aucun fichier n'est hébergé sur ce serveur.</p>
      </footer>
    </>
  )
}
