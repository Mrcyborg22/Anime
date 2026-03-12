# 🤖 Mr Cyborg Anime

Site de streaming animé scrappant `v6.voiranime.com`, avec design cyberpunk, support de toutes les résolutions, déployable sur Vercel.

## 🚀 Déploiement sur Vercel (Gratuit)

### Option 1 — Via GitHub (recommandé)

1. **Créer un repo GitHub** et y pousser ce dossier :
   ```bash
   git init
   git add .
   git commit -m "Mr Cyborg Anime"
   git remote add origin https://github.com/VOTRE_USERNAME/mr-cyborg-anime.git
   git push -u origin main
   ```

2. **Aller sur [vercel.com](https://vercel.com)** → New Project → Import depuis GitHub

3. **Configurer** :
   - Framework Preset: `Next.js` (auto-détecté)
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Déployer** → URL générée automatiquement !

### Option 2 — Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 💻 Développement local

```bash
npm install
npm run dev
# Ouvrir http://localhost:3000
```

## 🧠 Architecture

```
├── pages/
│   ├── index.js          # Page principale (UI cyberpunk)
│   ├── _app.js           # App wrapper
│   ├── _document.js      # HTML document
│   └── api/
│       ├── latest.js     # Derniers épisodes
│       ├── search.js     # Recherche
│       ├── anime.js      # Détail d'un animé
│       ├── episode.js    # Lecteurs d'épisode
│       └── proxy.js      # Proxy CORS pour streams
├── lib/
│   └── scraper.js        # Logique de scraping
└── styles/
    └── globals.css       # Design cyberpunk
```

## ✨ Fonctionnalités

- 🎌 Grille d'animés avec images
- 🔍 Recherche en temps réel
- 📺 Lecteur intégré (iframes)
- ⬇️ Liens de téléchargement toutes qualités (240p → 4K)
- 📱 100% responsive mobile/tablette/PC
- ⚡ Cache API Vercel (CDN edge)
- 🌐 Proxy CORS pour les streams HLS/M3U8
