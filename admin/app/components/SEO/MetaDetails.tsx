export interface SeoMetaProps {
	metaTitle: string;
	metaDescription: string;
	metaKeywords?: string;
	canonicalUrl?: string;
	ogUrl?: string;
	ogImage?: string;
	siteName?: string;
	ogType?: "website" | "article" | "product";
	hasPricing?: boolean;
	pricing?: {
		price: string;
	} | null;
}

export function MetaDetails({
	metaTitle,
	metaDescription,
	metaKeywords,
	canonicalUrl,
	ogUrl,
	ogImage,
	siteName = "WanderNest",
	ogType = "website",
	hasPricing = false,
	pricing = null,
}: SeoMetaProps) {
	return (
		<>
			<title>{metaTitle}</title>

			{/* Basic SEO */}
			<meta charSet="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<meta name="description" content={metaDescription} />
			{metaKeywords && <meta name="keywords" content={metaKeywords} />}
			{canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

			{/* Open Graph */}
			{ogUrl && <meta property="og:url" content={ogUrl} />}
			<meta property="og:type" content={ogType} />
			<meta property="og:site_name" content={siteName} />
			<meta property="og:title" content={metaTitle} />
			<meta property="og:description" content={metaDescription} />
			{ogImage && <meta property="og:image" content={ogImage} />}

			{/* Twitter Cards */}
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:title" content={metaTitle} />
			<meta name="twitter:description" content={metaDescription} />
			{ogImage && <meta name="twitter:image" content={ogImage} />}

			<meta name="robots" content="index, follow" />

			{hasPricing && pricing != null && (
				<>
					<meta property="product:price:amount" content={pricing.price} />
					<meta property="product:price:currency" content="AED" />
				</>
			)}
		</>
	);
}
