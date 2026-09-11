import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

let _uaIndex = 0;

function getUa() {
  return userAgents[_uaIndex++ % userAgents.length];
}

const PROXY = 'https://cf.elainaa.workers.dev/';

// ✅ DRACIN SCRAPER - Unified ES6 Module
export class DracinScraper {
  baseUrl = 'https://dracinema.cc';

  async home(page = 1) {
    const url = page === 1 ? this.baseUrl : this.baseUrl + `/page/${page}`;
    try {
      const res = await axios.get(PROXY + url, {
        headers: { 'User-Agent': getUa() },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 8000
      });

      const $ = cheerio.load(res.data);
      const items = [];

      $('div.drama-item, article.post-item').each((i, el) => {
        const link = $(el).find('a').first().attr('href');
        const img = $(el).find('img').attr('src');
        const title = $(el).find('h2, h3, .title').text().trim();
        const eps = $(el).find('.episode').text().trim() || 'Latest';

        if (title && link) {
          items.push({ title, link, img, eps, source: 'Dracinema' });
        }
      });

      console.log(`[DracinScraper] ✅ Scraped ${items.length} items`);
      return { data: { items } };
    } catch (e) {
      console.warn(`[DracinScraper] ⚠️ Failed:`, e.message);
      return { data: { items: [] } };
    }
  }

  async search(query) {
    try {
      const res = await axios.get(PROXY + `${this.baseUrl}/?s=${query}`, {
        headers: { 'User-Agent': getUa() },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 8000
      });

      const $ = cheerio.load(res.data);
      const items = [];

      $('div.drama-item, article.post-item').each((i, el) => {
        const link = $(el).find('a').first().attr('href');
        const img = $(el).find('img').attr('src');
        const title = $(el).find('h2, h3, .title').text().trim();

        if (title && link) {
          items.push({ title, link, img, eps: 'Search Result', source: 'Dracinema' });
        }
      });

      return items;
    } catch (e) {
      console.warn(`[DracinScraper] Search failed:`, e.message);
      return [];
    }
  }
}
