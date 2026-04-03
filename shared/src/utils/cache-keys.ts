const ENV = process.env.NODE_ENV || process.env.VITE_ENV || "development";
type CacheContext = "FP" | "AD"; // Front-Web or Admin

export const CACHE_KEYS = {
	ROOT: (context: CacheContext) => `${ENV}:${context}`,

	cities: {
		highLevel: (ctx: CacheContext) => `${CACHE_KEYS.ROOT(ctx)}:cities:high-level`,
		details: (ctx: CacheContext, cityId: string | number) =>
			`${CACHE_KEYS.ROOT(ctx)}:cities:details:${cityId}`,
		list: () => `${CACHE_KEYS.ROOT("AD")}:cities:list`,
	},

	tags: {
		tags: (ctx: CacheContext) => `${CACHE_KEYS.ROOT(ctx)}:tags:tags`,
		tag: (tagId: string | number) => `${CACHE_KEYS.ROOT("AD")}:tags:tag:${tagId}`,
		cityTags: (cityId: string | number) => `${CACHE_KEYS.ROOT("FP")}:tags:city-tags:${cityId}`,
	},

	cancellationPolicies: {
		list: () => `${CACHE_KEYS.ROOT("AD")}:cancellation-policies:list`,
	},

	categories: {
		highLevelAD: (q?: string, pageIndex?: number, pageSize?: number) => {
			return (
				`${CACHE_KEYS.ROOT("AD")}:categories:high-level` +
				(q && q.trim() !== "" ? `:q=${q.trim().toLowerCase()}` : "") +
				(pageIndex != null ? `:pi=${pageIndex}` : "") +
				(pageSize != null ? `:ps=${pageSize}` : "")
			);
		},
		highLevelFP: () => `${CACHE_KEYS.ROOT("FP")}:categories:high-level`,
		details: (categoryId: string | number) => `${CACHE_KEYS.ROOT("AD")}:categories:details:${categoryId}`,
		list: () => `${CACHE_KEYS.ROOT("AD")}:categories:list`,
	},

	dashboard: {
		mainStats: () => `${CACHE_KEYS.ROOT("AD")}:stats:dashboard-main-stats`,
		mainChartData: () => `${CACHE_KEYS.ROOT("AD")}:dashboard:main-chart-data`,
	},

	participantTypes: {
		list: () => `${CACHE_KEYS.ROOT("AD")}:participant-types:list`,
	},

	tourProviders: {
		list: (ctx: CacheContext) => `${CACHE_KEYS.ROOT(ctx)}:tour-providers:list`,
	},

	heroSections: {
		list: (ctx: CacheContext) => `${CACHE_KEYS.ROOT(ctx)}:hero-sections:list`,
		details: (id: string | number) => `${CACHE_KEYS.ROOT("AD")}:hero-sections:details:${id}`,
	},

	collections: {
		highLevelAD: (q?: string, pageIndex?: number, pageSize?: number) => {
			return (
				`${CACHE_KEYS.ROOT("AD")}:collections:high-level` +
				(q && q.trim() !== "" ? `:q=${q.trim().toLowerCase()}` : "") +
				(pageIndex != null ? `:pi=${pageIndex}` : "") +
				(pageSize != null ? `:ps=${pageSize}` : "")
			);
		},
		listFP: (isFeatured?: boolean, cityId?: number | null, pageIndex?: number, pageSize?: number) => {
			return (
				`${CACHE_KEYS.ROOT("FP")}:collections:list` +
				(isFeatured != null ? `:isFeatured=${isFeatured ? "Y" : "N"}` : "") +
				(cityId != null ? `:cityId=${cityId}` : "") +
				(pageIndex != null ? `:pi=${pageIndex}` : "") +
				(pageSize != null ? `:ps=${pageSize}` : "")
			);
		},
		details: (ctx: CacheContext, id: string | number) =>
			`${CACHE_KEYS.ROOT(ctx)}:collections:details:${id}`,
		tours: (
			collectionId?: number | string,
			pageIndex?: number,
			pageSize?: number,
			q?: string,
			filters?: Record<string, any>,
		) => {
			return (
				`${CACHE_KEYS.ROOT("FP")}:collections:tours` +
				(collectionId != null ? `:collectionId=${collectionId}` : "") +
				(pageIndex != null ? `:pi=${pageIndex}` : "") +
				(pageSize != null ? `:ps=${pageSize}` : "") +
				(q && q.trim() !== "" ? `:q=${q.trim().toLowerCase()}` : "") +
				(filters ? `:filters=${JSON.stringify(filters)}` : "")
			);
		},
	},

	bookings: {
		highLevel: (q?: string, pageIndex?: number, pageSize?: number) => {
			return (
				`${CACHE_KEYS.ROOT("AD")}:bookings:high-level` +
				(q && q.trim() !== "" ? `:q=${q.trim().toLowerCase()}` : "") +
				(pageIndex != null ? `:pi=${pageIndex}` : "") +
				(pageSize != null ? `:ps=${pageSize}` : "")
			);
		},
		details: (ctx: CacheContext, id: string | number) => `${CACHE_KEYS.ROOT(ctx)}:bookings:details:${id}`, //id or ref
		forConfirmation: (id: string | number) => `${CACHE_KEYS.ROOT("AD")}:bookings:for-confirmation:${id}`,
		user_bookings: (userId?: string | number, pageIndex?: number, pageSize?: number) => {
			return (
				`${CACHE_KEYS.ROOT("FP")}:bookings:user-bookings` +
				(userId != null ? `:uId=${userId}` : "") +
				(pageIndex != null ? `:pi=${pageIndex}` : "") +
				(pageSize != null ? `:ps=${pageSize}` : "")
			);
		},
	},

	tours: {
		list: (ctx: CacheContext, q?: string, pageIndex?: number, pageSize?: number) => {
			return (
				`${CACHE_KEYS.ROOT(ctx)}:tours:list` +
				(q && q.trim() !== "" ? `:q=${q.trim().toLowerCase()}` : "") +
				(pageIndex != null ? `:pi=${pageIndex}` : "") +
				(pageSize != null ? `:ps=${pageSize}` : "")
			);
		},
		optionsList: (ctx: CacheContext, q?: string, pageIndex?: number, pageSize?: number) => {
			return (
				`${CACHE_KEYS.ROOT(ctx)}:tour-options:list` +
				(q && q.trim() !== "" ? `:q=${q.trim().toLowerCase()}` : "") +
				(pageIndex != null ? `:pi=${pageIndex}` : "") +
				(pageSize != null ? `:ps=${pageSize}` : "")
			);
		},
		highLevel: (
			ctx: CacheContext,
			q?: string,
			pageIndex?: number,
			pageSize?: number,
			filters?: Record<string, any>,
		) => {
			return (
				`${CACHE_KEYS.ROOT(ctx)}:tours:high-level` +
				(q && q.trim() !== "" ? `:q=${q.trim().toLowerCase()}` : "") +
				(pageIndex != null ? `:pi=${pageIndex}` : "") +
				(pageSize != null ? `:ps=${pageSize}` : "") +
				(filters != null ? `:filters=${JSON.stringify(filters)}` : "")
			);
		},
		details: (ctx: CacheContext, id: string) => `${CACHE_KEYS.ROOT(ctx)}:tours:details:${id}`,
		detailForUpdate: (id: string) => `${CACHE_KEYS.ROOT("AD")}:tours:detail-for-update:${id}`,
		slotAvailability: (optionId?: number | string, dateStr?: string, tourId?: string) => {
			return (
				`${CACHE_KEYS.ROOT("FP")}:tours:slot-availability` +
				(tourId != null ? `:tourId=${tourId}` : "") +
				(optionId != null ? `:optionId=${optionId}` : "") +
				(dateStr != null ? `:dateStr=${dateStr}` : "")
			);
		},
	},

	cart: {
		user_cart: (user_id?: string | number, page?: number, limit?: number) => {
			return (
				`${CACHE_KEYS.ROOT("FP")}:cart:my_cart` +
				(user_id != null ? `:uID=${user_id}` : "") +
				(page != null ? `:pg=${page}` : "") +
				(limit != null ? `:ps=${limit}` : "")
			);
		},
	},

	reviews: {
		my_reviews: (user_id?: string | number, pageIndex?: number, pageSize?: number) => {
			return (
				`${CACHE_KEYS.ROOT("FP")}:reviews:my_reviews` +
				(user_id != null ? `:uID=${user_id}` : "") +
				(pageIndex != null ? `:pi=${pageIndex}` : "") +
				(pageSize != null ? `:ps=${pageSize}` : "")
			);
		},
		home: () => `${CACHE_KEYS.ROOT("FP")}:reviews:home`,
		tour: (tour_id?: string | number, limit?: number, offset?: number, filters?: Record<string, any>) => {
			return (
				`${CACHE_KEYS.ROOT("FP")}:reviews:tour` +
				(tour_id != null ? `:tID=${tour_id}` : "") +
				(limit != null ? `:limit=${limit}` : "") +
				(offset != null ? `:offset=${offset}` : "") +
				(filters != null ? `:filters=${JSON.stringify(filters)}` : "")
			);
		},
	},

	auth: {
		session: (ctx: CacheContext, authId: string) => `${CACHE_KEYS.ROOT(ctx)}:auth:session:${authId}`,
	},

	coupons: {
		highLevelAD: (q?: string) =>
			`${CACHE_KEYS.ROOT("AD")}:coupons:high-level` +
			(q && q.trim() !== "" ? `:q=${q.trim().toLowerCase()}` : ""),
		allFP: (user_id?: string | number) =>
			`${CACHE_KEYS.ROOT("FP")}:coupons:all` + (user_id != null ? `:uID=${user_id}` : ""),
		details: (ctx: CacheContext, couponId: number | string) =>
			`${CACHE_KEYS.ROOT(ctx)}:coupons:details:${couponId}`,
	},
};
