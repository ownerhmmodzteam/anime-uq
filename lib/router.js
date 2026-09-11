const registry = new Map();
const loaders = {
  sokuja: async () => import('./scrapers/sokuja.js'),
  gomunime: async () => import('./scrapers/gomunime.js'),
  anoboy: async () => import('./scrapers/anoboy.cjs'),
  otakudesu: async () => import('./scrapers/otakudesu.cjs'),
  samehadaku: async () => import('./scrapers/samehadaku.cjs'),
  nt: async () => import('./scrapers/nt.js'),
  donghua: async () => import('./scrapers/donghua.js'),
  dracin: async () => import('./scrapers/dracin.js'),
  drakor: async () => import('./scrapers/drakor.js')
};
export async function runSource(source, action, params) {
  if (!loaders[source]) throw new Error(`Unknown source: ${source}`);
  let mod = registry.get(source);
  if (!mod) { mod = await loaders[source](); registry.set(source, mod); }
  const target = mod.default || mod;
  const classEntry = Object.values(mod).find(v => typeof v === 'function' && /Scraper$/.test(v.name));
  const instance = classEntry ? new classEntry() : (typeof target === 'function' && /Scraper$/.test(target.name) ? new target() : null);
  const p = params || {};
  const page = Number(p.page || 1);
  if (source === 'sokuja') {
    const map = { home:'getHomepage', latest:'getLatestEpisodes', ongoing:'getOngoingAnime', completed:'getCompletedAnime', movie:'getMovieAnime', detail:'getAnimeDetails', episode:'getEpisodeDetails', search:'search' };
    const fn = map[action] || 'getHomepage';
    const args = action === 'search' ? [p.q, page] : action === 'detail' || action === 'episode' ? [p.slug || p.url] : [];
    return await target[fn](...args);
  }
  if (source === 'nt') {
    const map={home:'listAnime',latest:'listAnime',search:'search',ongoing:'ongoingList',popular:'popularSeries',schedule:'jadwalRilis',genres:'genreList',genre:'genreAnime',detail:'animeDetail',episode:'episodeDetail'};
    const fn=map[action]||'listAnime';
    const args=action==='search'?[p.q,page]:action==='genre'?[p.genre,page]:action==='detail'||action==='episode'?[p.url||p.slug]:['',page];
    return await target[fn](...args);
  }
  if (source === 'gomunime') {
    const map = { home:'scrapeHome', search:'scrapeSearch', ongoing:'scrapeOngoing', completed:'scrapeCompleted', genre:'scrapeGenre', detail:'scrapeAnimeInfo', episode:'watchEpisode' };
    const fn = map[action] || 'scrapeHome';
    const args = action === 'search' ? [p.q] : action === 'genre' ? [p.genre] : action === 'detail' ? [p.slug] : action === 'episode' ? [p.url] : [];
    return await target[fn](...args);
  }
  if (instance) {
    if (typeof instance[action] === 'function') {
      const args = action === 'search' ? [p.q, page] : action === 'detail' ? [p.slug || p.url] : action === 'episode' ? [p.slug || p.url, p.episode] : action === 'genre' ? [p.genre, page] : [page];
      return await instance[action](...args);
    }
    const fallback = action === 'latest' ? 'terbaru' : action === 'completed' ? 'complete' : action === 'home' ? 'home' : action;
    if (typeof instance[fallback] === 'function') return await instance[fallback](page);
  }
  throw new Error(`Action ${action} is not supported by ${source}`);
}
export const sources = Object.keys(loaders);
