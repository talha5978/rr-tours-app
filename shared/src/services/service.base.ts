import { type SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { STORAGE_BUCKETS } from "@workspace/shared/constants/constants";
import { createSupabaseServerClient } from "@workspace/shared/utils/supabase/supabase.server";
import { UserRole } from "@workspace/shared/types/user";
import type { Database } from "@workspace/shared/types/supabase";

type ServiceBaseCurrentUser = {
	id: string;
	email: string;
	role: UserRole;
};

export interface ServiceBase {
	supabase: SupabaseClient<Database>;
	headers: Headers;
	request: Request;
	currentUser?: ServiceBaseCurrentUser | null | undefined;
}

export class Service implements ServiceBase {
	supabase;
	readonly headers;
	readonly request;
	currentUser?: ServiceBaseCurrentUser | null | undefined = null;

	protected readonly IMAGES_BUCKET = STORAGE_BUCKETS.images;

	protected readonly CACHE_EVENTS_TABLE = "cache_invalidation_events";

	protected readonly USERS_TABLE = "app_users";
	protected readonly USER_ROLES_TABLE = "user_roles";

	protected readonly TOURS_TABLE = "tours";

	protected readonly META_DETAILS_TABLE = "meta_details";
	protected readonly CANCELLATION_POLICIES_TABLE = "cancellation_policies";
	protected readonly CATEGORIES_TABLE = "tours_categories";
	protected readonly PROVIDERS_TABLE = "activity_providers";
	protected readonly CITIES_TABLE = "cities";

	protected readonly TOURS_TAGS_LINK_TABLE = "tours_tags";
	protected readonly TOUR_TAGS_TABLE = "tour_tags";

	protected readonly TOUR_OPTIONS_TABLE = "tour_options";
	protected readonly TOUR_OPTION_PRICES_TABLE = "tour_option_prices";
	protected readonly PARTICIPANT_TYPES_TABLE = "participant_types";

	protected readonly AVAILABILITY_RULES_TABLE = "availability_rules";
	protected readonly TIMESLOTS_TABLE = "time_slots";
	protected readonly AVAILABILITY_OVERRIDES_TABLE = "availability_overrides";

	protected readonly HERO_SECTIONS_TABLE = "hero_sections";

	protected readonly COLLECTIONS_TABLE = "collections";
	protected readonly COLLECTION_TOURS_TABLE = "collection_tours";
	protected readonly COLLECTION_CITIES_TABLE = "collection_cities";

	protected readonly BOOKINGS_TABLE = "bookings_new";
	protected readonly BOOKING_PARTICIPANTS_TABLE = "booking_participants_new";
	protected readonly PAYMENTS_TABLE = "payments";
	protected readonly BOOKING_ITEMS_TABLE = "booking_items";

	protected readonly REVIEWS_TABLE = "tour_reviews";

	protected readonly CARTS_TABLE = "carts";
	protected readonly CART_ITEMS_TABLE = "cart_items";
	protected readonly CART_ITEMS_QUANTITIES_TABLE = "cart_items_quantities";

	protected readonly COUPONS_TABLE = "coupons";
	protected readonly COUPON_TOURS_TABLE = "coupon_tours";
	protected readonly COUPON_USAGES_TABLE = "coupon_usages";

	constructor(request: Request, opts?: { supabase?: SupabaseClient<Database>; headers?: Headers }) {
		if (opts?.supabase && opts?.headers) {
			this.supabase = opts.supabase;
			this.headers = opts.headers;
		} else {
			const result = createSupabaseServerClient(request);
			this.supabase = result.supabase;
			this.headers = result.headers;
		}
		this.request = request;
	}

	/**
	 * Convenience method that instantiates child service classes with the same
	 * supabase instance + headers so we only ever have one client per request.
	 * @alert This method only works for classes that extend [Service] class
	 */
	protected async createSubService<
		T extends new (
			request: Request,
			opts?: { supabase?: SupabaseClient<Database>; headers?: Headers },
			...rest: any[]
		) => Service,
	>(
		ServiceClass: T,
		...extraArgs: ConstructorParameters<T> extends [any, any, ...infer R] ? R : any[]
	): Promise<InstanceType<T>> {
		if (!this.supabase || !this.headers) {
			throw new ApiError(
				"createSubService: parent service has no supabase or headers available",
				400,
				[],
			);
		}

		if (!Service.prototype.isPrototypeOf(ServiceClass.prototype)) {
			throw new ApiError(`createSubService: ${ServiceClass.name} class must extend Service`, 400, []);
		}

		const anyServiceClass = ServiceClass as any;

		if (typeof anyServiceClass.fromParent === "function") {
			const maybePromise = anyServiceClass.fromParent(this, ...extraArgs);
			const resolved = await Promise.resolve(maybePromise);
			return resolved as InstanceType<T>;
		}

		const maybeInstance = new ServiceClass(
			this.request,
			{ supabase: this.supabase, headers: this.headers },
			...extraArgs,
		);

		const instance = await Promise.resolve(maybeInstance);

		return instance as InstanceType<T>;
	}
}
