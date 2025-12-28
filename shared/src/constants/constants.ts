export const STORAGE_BUCKETS = {
	images: "images",
} as const;

export const SUPABASE_IMAGE_BUCKET_PATH = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKETS.images}/`;
