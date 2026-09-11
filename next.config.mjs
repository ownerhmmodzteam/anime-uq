const nextConfig = { reactStrictMode: true, poweredByHeader: false, outputFileTracingIncludes: { "/*": ["./data/manhwa/**/*"] }, images: { remotePatterns: [{ protocol: "http", hostname: "**" }, { protocol: "https", hostname: "**" }] } };
export default nextConfig;
