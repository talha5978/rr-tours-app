import { CityService } from "@workspace/shared/services/cities.service";
import { ToursService } from "@workspace/shared/services/tours.service";
import { format } from "date-fns";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
	const baseUrl = process.env.VITE_MAIN_APP_URL;

	if (!baseUrl) {
		throw new Error("VITE_MAIN_APP_URL is not defined");
	}

	const urls: string[] = [];

	// Using Services directly for fresh data

	const tours_svc = new ToursService(request);
	const toursResp = await tours_svc.getFPHighLevelTours("", 0, 150, {});

	const city_svc = new CityService(request);
	const citiesResp = await city_svc.getFPHighLevelCities();

	urls.push(`
            <url>
            <loc>${baseUrl}</loc>
            <changefreq>daily</changefreq>
            <priority>1.0</priority>
            </url>
        `);

	["contact-us", "faqs", "track-booking", "booking", "my-favourites", "about"].forEach((url, idx) => {
		urls.push(
			`
            <url>
            <loc>${baseUrl}/${url}</loc>
            <priority>${idx <= 1 ? "1.0" : "0.9"}</priority>
            </url>
            `,
		);
	});

	urls.push(
		`
            <url>
            <loc>${baseUrl}/tours</loc>
            <changefreq>daily</changefreq>
            <priority>1.0</priority>
            </url>
            `,
	);

	urls.push(
		`
            <url>
            <loc>${baseUrl}/terms-of-usage</loc>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
            </url>
            `,
	);

	urls.push(
		`
            <url>
            <loc>${baseUrl}/privacy-policy</loc>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
            </url>
            `,
	);

	for (const tour of toursResp.tours) {
		urls.push(`
        <url>
            <loc>${baseUrl}/tours/tour/${tour.id}/${tour.url_key}</loc>
            ${tour.updated_at ? `<lastmod>${format(new Date(tour.updated_at), "yyyy-MM-dd")}</lastmod>` : ""}
            <changefreq>daily</changefreq>
            <priority>1.0</priority>
        </url>
        `);
	}

	for (const city of citiesResp.data) {
		urls.push(`
        <url>
            <loc>${baseUrl}/city/${city.id}/${city.url_key}</loc>
             <changefreq>weekly</changefreq>
            <priority>0.9</priority>
        </url>
        `);
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls.join("")}
    </urlset>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
