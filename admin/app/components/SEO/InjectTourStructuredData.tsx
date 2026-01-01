import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import { useEffect } from "react";

export function TourStructuredData({
	tour,
	canonicalUrl,
}: {
	tour: {
		name: string;
		overview: string;
		image: string;
	};
	canonicalUrl: string;
}) {
	useEffect(() => {
		const script = document.createElement("script");
		script.type = "application/ld+json";
		script.innerHTML = JSON.stringify({
			"@context": "https://schema.org",
			"@type": "Product",
			name: tour.name,
			description: tour.overview,
			image: SUPABASE_IMAGE_BUCKET_PATH + "/" + tour.image,
			brand: {
				"@type": "Brand",
				name: "Top Attractions Dubai",
			},
			offers: {
				"@type": "Offer",
				url: canonicalUrl,
				priceCurrency: "AED",
				availability: "https://schema.org/InStock",
			},
		});

		document.head.appendChild(script);

		return () => {
			document.head.removeChild(script);
		};
	}, [tour, canonicalUrl]);

	return null;
}
