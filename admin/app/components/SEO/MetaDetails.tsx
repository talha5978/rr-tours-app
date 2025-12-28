export interface SeoMetaProps {
	metaTitle: string;
	metaDescription: string;
	metaKeywords?: string;
	canonicalUrl?: string;
	ogUrl?: string;
	ogImage?: string;
}

export function MetaDetails({
	metaTitle,
	metaDescription,
	metaKeywords,
	canonicalUrl,
	ogUrl,
	ogImage,
}: SeoMetaProps) {
	return (
		<>
			<title>{metaTitle}</title>

			<meta name="description" content={metaDescription} />
			{metaKeywords && <meta name="keywords" content={metaKeywords} />}
			{canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

			{ogUrl && <meta property="og:url" content={ogUrl} />}
			<meta property="og:title" content={metaTitle} />
			<meta property="og:description" content={metaDescription} />
			{ogImage && <meta property="og:image" content={ogImage} />}
		</>
	);
}
