export const STORAGE_BUCKETS = {
	images: "images",
} as const;

export const SUPABASE_IMAGE_BUCKET_PATH = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKETS.images}`;

export const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
export const ALLOWED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const getSimpleImgFormats = () => {
	const formats = ALLOWED_IMAGE_FORMATS.map((format) => format.split("/")[1].toUpperCase());
	return formats.join(", ");
};

export const CATEGORY_IMG_DIMENSIONS = {
	min: { width: 500, height: 600 },
	max: { width: 1200, height: 1200 },
};

export const MAX_META_KEYWORDS = 25;
