export const loader = () => {
	const content = `User-agent: *\nAllow: /\nSitemap: ${process.env.VITE_MAIN_APP_URL}/sitemap.xml`;

	return new Response(content.trim(), {
		headers: {
			"Content-Type": "text/plain",
			"Cache-Control": "public, max-age=86400",
		},
	});
};
