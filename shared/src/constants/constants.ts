import { Constants } from "@workspace/shared/types/supabase";

export const CONTACT_NUMBER_1 = "971556130581" as const;
export const EMAIL_ADDRESS_1 = "wandernest@gmail.com" as const;
export const INSTAGRAM_URL = "https://www.instagram.com/top_attractionsdubai" as const;
export const FB_URL = "https://www.facebook.com/share/g/1AqEVNTwYG/?mibextid=wwXIfr" as const;

export const STORAGE_BUCKETS = {
	images: "images",
} as const;

export const SUPABASE_IMAGE_BUCKET_PATH = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKETS.images}`;

export const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
export const ALLOWED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp"];

export const getSimpleImgFormats = () => {
	const formats = ALLOWED_IMAGE_FORMATS.map((format) => format.split("/")[1].toUpperCase());
	return formats.join(", ");
};

export const CATEGORY_IMG_DIMENSIONS = {
	min: { width: 500, height: 600 },
	max: { width: 3000, height: 3000 },
} as const;

export const CITY_CARD_IMG_DIMENSTIONS = {
	min: { width: 500, height: 600 },
	max: { width: 3000, height: 3000 },
} as const;

export const CITY_FULL_IMG_DIMENSTIONS = {
	min: { width: 700, height: 700 },
	max: { width: 3000, height: 3000 },
} as const;

export const TOUR_IMG_DIMENSTIONS = {
	min: { width: 500, height: 500 },
	max: { width: 3000, height: 3000 },
};

export const TAG_IMG_DIMENSIONS = {
	min: { width: 10, height: 10 },
	max: { width: 500, height: 500 },
};

export const HERO_SECTION_IMG_DIMENSIONS = {
	min: { width: 800, height: 800 },
	max: { width: 3500, height: 3500 },
};

export const MAX_META_KEYWORDS = 25;

export const sortTypeEnums = ["asc", "desc"] as const;

export const defaultTourSortByFilter = "created_at" as const;
export const defaultTourSortTypeFilter = "desc" as const;
export const tourSortByEnums = ["created_at", "updated_at", "isFeatured", "isActive"] as const;

export const fpDefaultTourSortByFilter = "recommended" as const;
export const fpDefaultTourSortTypeFilter = "desc" as const;
export const fpTourSortByEnums = ["recommended", "price"] as const;

export const BOOKING_STATUS = Constants.public.Enums.booking_status_enum;
export const PAYMENT_STATUS = Constants.public.Enums.payment_status_enum;
export const AVAILABILITY_OVERRIDE_TYPE = Constants.public.Enums.availability_override_type;

export const PAYMENT_CURRENCY = "aed" as const;
