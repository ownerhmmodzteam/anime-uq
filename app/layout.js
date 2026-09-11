import './globals.css';

export const metadata = { title: 'StreamHub', description: 'Anime, manhwa and media discovery' };

export default function RootLayout({ children }) {
  return <html lang="id"><head><meta name="theme-color" content="#090a0c"/><meta name="color-scheme" content="dark"/></head><body>{children}</body></html>;
}
