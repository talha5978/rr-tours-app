export type FP_HighLevelTour = {
	id: string;
	name: string;
	cover_image: string;
	updated_at: string | null;
	url_key: string;
	toBeSoldOutScore: number;
	price: number;
	city: {
		id: number;
		name: string;
		url_key: string;
	};
	category: {
		id: number;
		name: string;
		url_key: string;
	};
};

export type GetFPHighLevelToursResponse = {
	tours: FP_HighLevelTour[];
	total: number;
};
