# StreamHub

Next.js streaming and media discovery frontend with server-side source adapters.

## Local

npm install
npm run dev

Open http://localhost:3000

## Environment

Copy .env.example to .env.local.

SANKA_BASE_URL=https://www.sankavollerei.web.id
SANKA_COMIC_SOURCE=komiku
SANKA_TIMEOUT=10000
CACHE_TTL=300

Manhwa data is fetched through the Sanka Comic REST API. The local JSON dataset is not used by the app.
