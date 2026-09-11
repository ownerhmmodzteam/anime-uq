import axios from 'axios';
export const http = axios.create({ timeout: Number(process.env.SCRAPER_TIMEOUT || 10000), maxRedirects: 4, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StreamHub/1.0)', 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8' } });
export async function getHtml(url, config = {}) { const r = await http.get(url, config); return r.data; }
