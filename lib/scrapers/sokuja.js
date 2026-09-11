import axios from 'axios';
import * as cheerio from 'cheerio';

let BASE_URL = "https://x6.sokuja.uk/";
let globalProxy = null;

/**
 * Configure global proxy for Axios requests.
 * @param {string} proxyUrl - Proxy URL
 */
function setProxy(proxyUrl) {
    globalProxy = proxyUrl;
}

/**
 * Change active URL if the mirror domain changes.
 * @param {string} url - Base URL
 */
function setBaseUrl(url) {
    if (url) {
        BASE_URL = url.endsWith('/') ? url : `${url}/`;
    }
}

/**
 * Perform a GET request to the site.
 * @param {string} url - Target URL
 * @param {object} params - Query parameters
 */
async function fetchPage(url, params = {}) {
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": BASE_URL
    };
    
    const requestConfig = {
        headers,
        params,
        timeout: 15000
    };
    
    if (globalProxy) {
        try {
            const parsed = new URL(globalProxy);
            requestConfig.proxy = {
                protocol: parsed.protocol.replace(':', ''),
                host: parsed.hostname,
                port: parseInt(parsed.port)
            };
            if (parsed.username) {
                requestConfig.proxy.auth = {
                    username: parsed.username,
                    password: parsed.password
                };
            }
        } catch (e) {
            /* ignore */
        }
    }
    
    const response = await axios.get(url, requestConfig);
    return response.data;
}

/**
 * Parse an image source or srcset to find the high quality image.
 * @param {object} img - Cheerio image element
 */
function getImgSrc(img) {
    if (!img) return '';
    const src = img.attr('src') || '';
    if (src.startsWith('http')) return src;
    if (src.startsWith('/_next/image')) {
        const decoded = decodeURIComponent(src);
        const match = decoded.match(/url=(.*?)&/);
        if (match) return match[1];
    }
    return src;
}

/**
 * Parse slider/hero items from homepage.
 * @param {object} $ - Cheerio loaded object
 * @param {object} el - Element to parse
 */
function parseSliderItem($, el) {
    const card = $(el);
    const link = card.find('a').first();
    const href = link.attr('href') || '';
    const img = card.find('img').first();
    
    const genres = [];
    card.find('div.mt-2.flex a').each((i, ael) => {
        genres.push($(ael).text().trim());
    });
    
    const ratingText = card.find('span:contains("★")').text().replace('★', '').trim();
    
    return {
        title: card.find('h3').text().trim(),
        slug: href.replace(/^\/anime\//, '').replace(/\/$/, ''),
        url: href ? `${BASE_URL.replace(/\/$/, '')}${href}` : '',
        image: getImgSrc(img),
        genres,
        type: card.find('span').eq(1).text().trim(),
        score: ratingText || null,
        synopsis: card.find('p.mt-2').text().trim()
    };
}

/**
 * Parse latest updates card from homepage.
 * @param {object} $ - Cheerio loaded object
 * @param {object} el - Element to parse
 */
function parseLatestCard($, el) {
    const card = $(el);
    const href = card.attr('href') || '';
    const img = card.find('img').first();
    
    const epText = card.find('span.absolute.left-2').text().replace('EP', '').trim();
    const typeText = card.find('span.absolute.right-2').text().trim();
    const statusText = card.find('span.absolute.bottom-0').text().trim();
    const metaText = card.find('div.mt-0.5').text().trim();
    const date = metaText.replace(/Episode\s+\d+/i, '').replace(/^[\s·•\-\.]+/g, '').trim();
    
    return {
        title: card.find('h3').text().trim(),
        slug: href.replace(/^\//, '').replace(/\/$/, ''),
        url: href ? `${BASE_URL.replace(/\/$/, '')}${href}` : '',
        image: getImgSrc(img),
        episode: epText || null,
        type: typeText || null,
        status: statusText || null,
        date: date || null
    };
}

/**
 * Parse standard anime card from grids.
 * @param {object} $ - Cheerio loaded object
 * @param {object} el - Element to parse
 */
function parseGridCard($, el) {
    const card = $(el);
    const href = card.attr('href') || '';
    const img = card.find('img').first();
    
    const typeText = card.find('span.absolute.left-2').text().trim();
    const ratingText = card.find('span.absolute.right-2').text().replace('★', '').trim();
    const statusText = card.find('span.absolute.bottom-0').text().trim();
    
    return {
        title: card.find('h3').text().trim(),
        slug: href.replace(/^\/anime\//, '').replace(/\/$/, ''),
        url: href ? `${BASE_URL.replace(/\/$/, '')}${href}` : '',
        image: getImgSrc(img),
        type: typeText || null,
        score: ratingText || null,
        status: statusText || null,
        year: card.find('p.text-xs').text().trim()
    };
}

/**
 * 1. Get Homepage Sections (Slider, Update Terbaru, Ongoing, Completed)
 */
async function getHomepage() {
    try {
        const html = await fetchPage(BASE_URL);
        const $ = cheerio.load(html);
        
        const slider = [];
        $('#S\\:0 .snap-center').each((i, el) => {
            slider.push(parseSliderItem($, el));
        });
        
        const latest = [];
        $('#S\\:1 a.group').each((i, el) => {
            latest.push(parseLatestCard($, el));
        });
        
        const ongoing = [];
        $('#S\\:2 a.group').each((i, el) => {
            ongoing.push(parseGridCard($, el));
        });
        
        const completed = [];
        $('#S\\:3 a.group').each((i, el) => {
            completed.push(parseGridCard($, el));
        });
        
        return {
            slider,
            latest,
            ongoing,
            completed
        };
    } catch (error) {
        return { error: error.message };
    }
}

/**
 * 2. Get Latest Episodes (Paginated)
 * @param {number} page 
 */
async function getLatestEpisodes(page = 1) {
    try {
        const url = page === 1 ? BASE_URL : `${BASE_URL}?page=${page}`;
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const episodes = [];
        $('#S\\:1 a.group').each((i, el) => {
            episodes.push(parseLatestCard($, el));
        });
        
        return {
            page: Number(page),
            episodes
        };
    } catch (error) {
        return { error: error.message };
    }
}

/**
 * 3. Get Ongoing Anime List (Paginated)
 * @param {number} page 
 */
async function getOngoingAnime(page = 1) {
    try {
        const url = `${BASE_URL}anime/?status=ongoing&order=update&page=${page}`;
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const anime = [];
        $('main .grid a.group').each((i, el) => {
            anime.push(parseGridCard($, el));
        });
        
        return {
            page: Number(page),
            anime
        };
    } catch (error) {
        return { error: error.message };
    }
}

/**
 * 4. Get Completed Anime List (Paginated)
 * @param {number} page 
 */
async function getCompletedAnime(page = 1) {
    try {
        const url = `${BASE_URL}anime/?status=completed&order=update&page=${page}`;
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const anime = [];
        $('main .grid a.group').each((i, el) => {
            anime.push(parseGridCard($, el));
        });
        
        return {
            page: Number(page),
            anime
        };
    } catch (error) {
        return { error: error.message };
    }
}

/**
 * 5. Get Movie Anime List (Paginated)
 * @param {number} page 
 */
async function getMovieAnime(page = 1) {
    try {
        const url = `${BASE_URL}anime/?type=movie&order=update&page=${page}`;
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const anime = [];
        $('main .grid a.group').each((i, el) => {
            anime.push(parseGridCard($, el));
        });
        
        return {
            page: Number(page),
            anime
        };
    } catch (error) {
        return { error: error.message };
    }
}

/**
 * 6. Get Anime Details, Synopsis, Metadata, and Episode List
 * @param {string} urlOrSlug 
 */
async function getAnimeDetails(urlOrSlug) {
    try {
        let url = urlOrSlug;
        if (!url.startsWith('http')) {
            const clean = urlOrSlug.replace(/^\/anime\//, '').replace(/^\//, '');
            url = `${BASE_URL}anime/${clean}/`;
        }
        
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const title = $('h1').first().text().replace('Subtitle Indonesia', '').trim();
        const altTitles = $('h1').first().next('p').text().trim();
        
        const posterImg = $('main img').first();
        const image = getImgSrc(posterImg);
        
        const score = $('main span.text-2xl.font-bold').text().trim();
        
        const genres = [];
        $('main div.flex.flex-wrap.gap-2 a[href^="/genre/"]').each((i, el) => {
            genres.push($(el).text().trim());
        });
        
        const meta = {};
        $('main dl div.flex').each((i, el) => {
            const key = $(el).find('dt').text().trim();
            const value = $(el).find('dd').text().trim();
            if (key) meta[key] = value;
        });
        
        const synopsis = $('main div.prose.prose-invert').text().trim();
        
        const episodes = [];
        $('main div.space-y-1 a').each((i, el) => {
            const href = $(el).attr('href') || '';
            episodes.push({
                title: $(el).find('span').first().text().trim(),
                slug: href.replace(/^\//, '').replace(/\/$/, ''),
                url: href ? `${BASE_URL.replace(/\/$/, '')}${href}` : '',
                date: $(el).find('span').eq(1).text().trim()
            });
        });
        
        return {
            title,
            altTitles,
            slug: url.replace(/https?:\/\/x6\.sokuja\.uk\/anime\//, '').replace(/\/$/, ''),
            url,
            image,
            score,
            genres,
            meta,
            synopsis,
            episodes
        };
    } catch (error) {
        return { error: error.message };
    }
}

/**
 * 7. Get Episode Video Streaming Player Direct MP4 Links & Download Links
 * @param {string} urlOrSlug 
 */
async function getEpisodeDetails(urlOrSlug) {
    try {
        let url = urlOrSlug;
        if (!url.startsWith('http')) {
            const clean = urlOrSlug.replace(/^\//, '');
            url = `${BASE_URL}${clean}/`;
        }
        
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const title = $('h1').first().text().trim();
        
        const downloads = [];
        $('main div.rounded-xl.bg-sokuja-card.p-4 a').each((i, el) => {
            const resolution = $(el).find('span').text().trim();
            downloads.push({
                resolution,
                url: $(el).attr('href') || ''
            });
        });
        
        let episodeId = null;
        let streams = [];
        
        $('script').each((i, el) => {
            const content = $(el).html();
            if (content && content.includes('episodeId')) {
                const match = content.match(/\\?"episodeId\\?":\s*(\d+)/);
                if (match) {
                    episodeId = parseInt(match[1]);
                }
            }
        });
        
        if (episodeId) {
            const mirrorsUrl = `${BASE_URL}api/video-mirrors?e=${episodeId}`;
            try {
                const mirrorsRes = await fetchPage(mirrorsUrl);
                if (mirrorsRes && mirrorsRes.mirrors) {
                    streams = mirrorsRes.mirrors.map(m => ({
                        id: m.id,
                        server: m.serverName,
                        url: m.embedUrl,
                        type: m.embedType,
                        quality: m.quality
                    }));
                }
            } catch (e) {
                /* ignore api fail */
            }
        }
        
        return {
            title,
            slug: url.replace(/https?:\/\/x6\.sokuja\.uk\//, '').replace(/\/$/, ''),
            url,
            episodeId,
            streams,
            downloads
        };
    } catch (error) {
        return { error: error.message };
    }
}

/**
 * 8. Search Anime by query (Paginated)
 * @param {string} query 
 * @param {number} page 
 */
async function search(query, page = 1) {
    try {
        const url = `${BASE_URL}anime/`;
        const html = await fetchPage(url, { q: query, page });
        const $ = cheerio.load(html);
        
        const anime = [];
        $('main .grid a.group').each((i, el) => {
            anime.push(parseGridCard($, el));
        });
        
        return {
            query,
            page: Number(page),
            anime
        };
    } catch (error) {
        return { error: error.message };
    }
}

export {
    setProxy,
    setBaseUrl,
    getHomepage,
    getLatestEpisodes,
    getOngoingAnime,
    getCompletedAnime,
    getMovieAnime,
    getAnimeDetails,
    getEpisodeDetails,
    search
};