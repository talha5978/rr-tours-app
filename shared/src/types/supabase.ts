export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "14.1";
	};
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			activity_providers: {
				Row: {
					id: number;
					name: string;
				};
				Insert: {
					id?: number;
					name: string;
				};
				Update: {
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			app_users: {
				Row: {
					country: string | null;
					created_at: string | null;
					first_name: string;
					last_name: string;
					phone_number: string | null;
					role: number;
					status: boolean;
					user_id: string;
				};
				Insert: {
					country?: string | null;
					created_at?: string | null;
					first_name: string;
					last_name: string;
					phone_number?: string | null;
					role: number;
					status?: boolean;
					user_id: string;
				};
				Update: {
					country?: string | null;
					created_at?: string | null;
					first_name?: string;
					last_name?: string;
					phone_number?: string | null;
					role?: number;
					status?: boolean;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "users_role_fkey";
						columns: ["role"];
						isOneToOne: false;
						referencedRelation: "user_roles";
						referencedColumns: ["id"];
					},
				];
			};
			availability_overrides: {
				Row: {
					created_at: string;
					date: string;
					id: number;
					new_capacity: number | null;
					override_type: Database["public"]["Enums"]["availability_override_type"];
					time_slot_id: number | null;
					tour_option_id: number;
				};
				Insert: {
					created_at?: string;
					date: string;
					id?: never;
					new_capacity?: number | null;
					override_type: Database["public"]["Enums"]["availability_override_type"];
					time_slot_id?: number | null;
					tour_option_id: number;
				};
				Update: {
					created_at?: string;
					date?: string;
					id?: never;
					new_capacity?: number | null;
					override_type?: Database["public"]["Enums"]["availability_override_type"];
					time_slot_id?: number | null;
					tour_option_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "availability_overrides_time_slot_id_fkey";
						columns: ["time_slot_id"];
						isOneToOne: false;
						referencedRelation: "time_slots";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "availability_overrides_tour_option_id_fkey";
						columns: ["tour_option_id"];
						isOneToOne: false;
						referencedRelation: "tour_options";
						referencedColumns: ["id"];
					},
				];
			};
			availability_rules: {
				Row: {
					created_at: string;
					end_date: string;
					id: number;
					is_active: boolean;
					start_date: string;
					tour_option_id: number;
					weekdays: number[];
				};
				Insert: {
					created_at?: string;
					end_date: string;
					id?: number;
					is_active?: boolean;
					start_date: string;
					tour_option_id: number;
					weekdays: number[];
				};
				Update: {
					created_at?: string;
					end_date?: string;
					id?: number;
					is_active?: boolean;
					start_date?: string;
					tour_option_id?: number;
					weekdays?: number[];
				};
				Relationships: [
					{
						foreignKeyName: "availability_rules_tour_option_id_fkey";
						columns: ["tour_option_id"];
						isOneToOne: false;
						referencedRelation: "tour_options";
						referencedColumns: ["id"];
					},
				];
			};
			booking_items: {
				Row: {
					booking_id: string;
					confirmed_date: string | null;
					confirmed_timeslot: string | null;
					id: string;
					preffered_date: string | null;
					preffered_timeslot: string | null;
					price_overriden: boolean | null;
					pricing_note: string | null;
					tour_option_id: number;
				};
				Insert: {
					booking_id: string;
					confirmed_date?: string | null;
					confirmed_timeslot?: string | null;
					id?: string;
					preffered_date?: string | null;
					preffered_timeslot?: string | null;
					price_overriden?: boolean | null;
					pricing_note?: string | null;
					tour_option_id: number;
				};
				Update: {
					booking_id?: string;
					confirmed_date?: string | null;
					confirmed_timeslot?: string | null;
					id?: string;
					preffered_date?: string | null;
					preffered_timeslot?: string | null;
					price_overriden?: boolean | null;
					pricing_note?: string | null;
					tour_option_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "booking_items_booking_id_fkey";
						columns: ["booking_id"];
						isOneToOne: false;
						referencedRelation: "bookings_new";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "booking_items_tour_option_id_fkey";
						columns: ["tour_option_id"];
						isOneToOne: false;
						referencedRelation: "tour_options";
						referencedColumns: ["id"];
					},
				];
			};
			booking_participants: {
				Row: {
					booking_id: string;
					id: string;
					participant_type_id: number;
					quantity: number;
					unit_price: number;
				};
				Insert: {
					booking_id: string;
					id?: string;
					participant_type_id: number;
					quantity: number;
					unit_price: number;
				};
				Update: {
					booking_id?: string;
					id?: string;
					participant_type_id?: number;
					quantity?: number;
					unit_price?: number;
				};
				Relationships: [
					{
						foreignKeyName: "booking_participants_booking_id_fkey";
						columns: ["booking_id"];
						isOneToOne: false;
						referencedRelation: "bookings";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "booking_participants_participant_type_id_fkey";
						columns: ["participant_type_id"];
						isOneToOne: false;
						referencedRelation: "participant_types";
						referencedColumns: ["id"];
					},
				];
			};
			booking_participants_new: {
				Row: {
					booking_item_id: string;
					id: string;
					participant_type_id: number;
					quantity: number;
					unit_price: number;
				};
				Insert: {
					booking_item_id: string;
					id?: string;
					participant_type_id: number;
					quantity: number;
					unit_price: number;
				};
				Update: {
					booking_item_id?: string;
					id?: string;
					participant_type_id?: number;
					quantity?: number;
					unit_price?: number;
				};
				Relationships: [
					{
						foreignKeyName: "booking_participants_new_booking_item_id_fkey";
						columns: ["booking_item_id"];
						isOneToOne: false;
						referencedRelation: "booking_items";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "booking_participants_new_participant_type_id_fkey";
						columns: ["participant_type_id"];
						isOneToOne: false;
						referencedRelation: "participant_types";
						referencedColumns: ["id"];
					},
				];
			};
			bookings: {
				Row: {
					added_by: string | null;
					admin_note: string | null;
					booking_ref: string;
					booking_status: Database["public"]["Enums"]["booking_status_enum"];
					cancelled_at: string | null;
					checkout_session_id: string | null;
					confirmed_at: string | null;
					confirmed_date: string | null;
					confirmed_timeslot: string | null;
					created_at: string;
					customer_email: string | null;
					customer_name: string | null;
					customer_phone: string | null;
					discount: number;
					id: string;
					payment_ref: string | null;
					payment_status: Database["public"]["Enums"]["payment_status_enum"];
					preferred_date: string | null;
					preferred_timeslot: string | null;
					price_overriden: boolean;
					pricing_note: string | null;
					subtotal_amount: number;
					taxes: number;
					total: number;
					tour_id: string | null;
					tour_name: string | null;
					tour_option_id: number | null;
					tour_option_name: string | null;
					updated_at: string;
				};
				Insert: {
					added_by?: string | null;
					admin_note?: string | null;
					booking_ref: string;
					booking_status?: Database["public"]["Enums"]["booking_status_enum"];
					cancelled_at?: string | null;
					checkout_session_id?: string | null;
					confirmed_at?: string | null;
					confirmed_date?: string | null;
					confirmed_timeslot?: string | null;
					created_at?: string;
					customer_email?: string | null;
					customer_name?: string | null;
					customer_phone?: string | null;
					discount?: number;
					id?: string;
					payment_ref?: string | null;
					payment_status: Database["public"]["Enums"]["payment_status_enum"];
					preferred_date?: string | null;
					preferred_timeslot?: string | null;
					price_overriden?: boolean;
					pricing_note?: string | null;
					subtotal_amount?: number;
					taxes?: number;
					total?: number;
					tour_id?: string | null;
					tour_name?: string | null;
					tour_option_id?: number | null;
					tour_option_name?: string | null;
					updated_at?: string;
				};
				Update: {
					added_by?: string | null;
					admin_note?: string | null;
					booking_ref?: string;
					booking_status?: Database["public"]["Enums"]["booking_status_enum"];
					cancelled_at?: string | null;
					checkout_session_id?: string | null;
					confirmed_at?: string | null;
					confirmed_date?: string | null;
					confirmed_timeslot?: string | null;
					created_at?: string;
					customer_email?: string | null;
					customer_name?: string | null;
					customer_phone?: string | null;
					discount?: number;
					id?: string;
					payment_ref?: string | null;
					payment_status?: Database["public"]["Enums"]["payment_status_enum"];
					preferred_date?: string | null;
					preferred_timeslot?: string | null;
					price_overriden?: boolean;
					pricing_note?: string | null;
					subtotal_amount?: number;
					taxes?: number;
					total?: number;
					tour_id?: string | null;
					tour_name?: string | null;
					tour_option_id?: number | null;
					tour_option_name?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "bookings_added_by_fkey";
						columns: ["added_by"];
						isOneToOne: false;
						referencedRelation: "app_users";
						referencedColumns: ["user_id"];
					},
					{
						foreignKeyName: "bookings_tour_id_fkey";
						columns: ["tour_id"];
						isOneToOne: false;
						referencedRelation: "tours";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "bookings_tour_option_id_fkey";
						columns: ["tour_option_id"];
						isOneToOne: false;
						referencedRelation: "tour_options";
						referencedColumns: ["id"];
					},
				];
			};
			bookings_new: {
				Row: {
					added_by: string | null;
					admin_note: string | null;
					applied_coupon_id: number | null;
					booking_ref: string;
					booking_status: Database["public"]["Enums"]["booking_status_enum"];
					cancelled_at: string | null;
					created_at: string;
					customer_email: string | null;
					customer_name: string | null;
					customer_phone: string | null;
					discount: number;
					id: string;
					payment_id: string | null;
					subtotal_amount: number;
					taxes: number;
					total: number;
					updated_at: string;
				};
				Insert: {
					added_by?: string | null;
					admin_note?: string | null;
					applied_coupon_id?: number | null;
					booking_ref: string;
					booking_status?: Database["public"]["Enums"]["booking_status_enum"];
					cancelled_at?: string | null;
					created_at?: string;
					customer_email?: string | null;
					customer_name?: string | null;
					customer_phone?: string | null;
					discount?: number;
					id?: string;
					payment_id?: string | null;
					subtotal_amount?: number;
					taxes?: number;
					total?: number;
					updated_at?: string;
				};
				Update: {
					added_by?: string | null;
					admin_note?: string | null;
					applied_coupon_id?: number | null;
					booking_ref?: string;
					booking_status?: Database["public"]["Enums"]["booking_status_enum"];
					cancelled_at?: string | null;
					created_at?: string;
					customer_email?: string | null;
					customer_name?: string | null;
					customer_phone?: string | null;
					discount?: number;
					id?: string;
					payment_id?: string | null;
					subtotal_amount?: number;
					taxes?: number;
					total?: number;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "bookings_new_added_by_fkey";
						columns: ["added_by"];
						isOneToOne: false;
						referencedRelation: "app_users";
						referencedColumns: ["user_id"];
					},
					{
						foreignKeyName: "bookings_new_applied_coupon_id_fkey";
						columns: ["applied_coupon_id"];
						isOneToOne: false;
						referencedRelation: "coupons";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "bookings_new_payment_id_fkey";
						columns: ["payment_id"];
						isOneToOne: false;
						referencedRelation: "payments";
						referencedColumns: ["id"];
					},
				];
			};
			cancellation_policies: {
				Row: {
					id: number;
					policy: string;
				};
				Insert: {
					id?: number;
					policy: string;
				};
				Update: {
					id?: number;
					policy?: string;
				};
				Relationships: [];
			};
			cart_items: {
				Row: {
					cart_id: number;
					created_at: string | null;
					id: number;
					preferred_date: string | null;
					preferred_timeslot: string | null;
					tour_option_id: number;
				};
				Insert: {
					cart_id: number;
					created_at?: string | null;
					id?: number;
					preferred_date?: string | null;
					preferred_timeslot?: string | null;
					tour_option_id: number;
				};
				Update: {
					cart_id?: number;
					created_at?: string | null;
					id?: number;
					preferred_date?: string | null;
					preferred_timeslot?: string | null;
					tour_option_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "cart_items_cart_id_fkey";
						columns: ["cart_id"];
						isOneToOne: false;
						referencedRelation: "carts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "cart_items_tour_option_id_fkey";
						columns: ["tour_option_id"];
						isOneToOne: false;
						referencedRelation: "tour_options";
						referencedColumns: ["id"];
					},
				];
			};
			cart_items_quantities: {
				Row: {
					cart_item_id: number;
					id: number;
					participant_type_id: number;
					quantity: number;
				};
				Insert: {
					cart_item_id: number;
					id?: number;
					participant_type_id: number;
					quantity: number;
				};
				Update: {
					cart_item_id?: number;
					id?: number;
					participant_type_id?: number;
					quantity?: number;
				};
				Relationships: [
					{
						foreignKeyName: "cart_items_quantities_cart_item_id_fkey";
						columns: ["cart_item_id"];
						isOneToOne: false;
						referencedRelation: "cart_items";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "cart_items_quantities_participant_type_id_fkey";
						columns: ["participant_type_id"];
						isOneToOne: false;
						referencedRelation: "participant_types";
						referencedColumns: ["id"];
					},
				];
			};
			carts: {
				Row: {
					created_at: string | null;
					expires_at: string | null;
					id: number;
					user_id: string | null;
				};
				Insert: {
					created_at?: string | null;
					expires_at?: string | null;
					id?: number;
					user_id?: string | null;
				};
				Update: {
					created_at?: string | null;
					expires_at?: string | null;
					id?: number;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "carts_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: true;
						referencedRelation: "app_users";
						referencedColumns: ["user_id"];
					},
				];
			};
			cities: {
				Row: {
					card_image: string;
					created_at: string | null;
					full_image: string;
					id: number;
					meta_details_id: string;
					name: string;
				};
				Insert: {
					card_image: string;
					created_at?: string | null;
					full_image: string;
					id?: number;
					meta_details_id: string;
					name: string;
				};
				Update: {
					card_image?: string;
					created_at?: string | null;
					full_image?: string;
					id?: number;
					meta_details_id?: string;
					name?: string;
				};
				Relationships: [
					{
						foreignKeyName: "cities_meta_details_id_fkey";
						columns: ["meta_details_id"];
						isOneToOne: false;
						referencedRelation: "meta_details";
						referencedColumns: ["id"];
					},
				];
			};
			collection_cities: {
				Row: {
					city_id: number;
					collection_id: number;
					id: number;
				};
				Insert: {
					city_id: number;
					collection_id: number;
					id?: number;
				};
				Update: {
					city_id?: number;
					collection_id?: number;
					id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "collection_cities_city_id_fkey";
						columns: ["city_id"];
						isOneToOne: false;
						referencedRelation: "cities";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "collection_cities_collection_id_fkey";
						columns: ["collection_id"];
						isOneToOne: false;
						referencedRelation: "collections";
						referencedColumns: ["id"];
					},
				];
			};
			collection_tours: {
				Row: {
					collection_id: number;
					id: number;
					tour_id: string;
				};
				Insert: {
					collection_id: number;
					id?: number;
					tour_id: string;
				};
				Update: {
					collection_id?: number;
					id?: number;
					tour_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "collection_tours_collection_id_fkey";
						columns: ["collection_id"];
						isOneToOne: false;
						referencedRelation: "collections";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "collection_tours_tour_id_fkey";
						columns: ["tour_id"];
						isOneToOne: false;
						referencedRelation: "tours";
						referencedColumns: ["id"];
					},
				];
			};
			collections: {
				Row: {
					created_at: string;
					description: string | null;
					id: number;
					isFeatured: boolean;
					name: string;
				};
				Insert: {
					created_at?: string;
					description?: string | null;
					id?: number;
					isFeatured?: boolean;
					name: string;
				};
				Update: {
					created_at?: string;
					description?: string | null;
					id?: number;
					isFeatured?: boolean;
					name?: string;
				};
				Relationships: [];
			};
			coupon_tours: {
				Row: {
					coupon_id: number;
					id: number;
					tour_option_id: number;
				};
				Insert: {
					coupon_id: number;
					id?: number;
					tour_option_id: number;
				};
				Update: {
					coupon_id?: number;
					id?: number;
					tour_option_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "coupon_tours_coupon_id_fkey";
						columns: ["coupon_id"];
						isOneToOne: false;
						referencedRelation: "coupons";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "coupon_tours_tour_option_id_fkey";
						columns: ["tour_option_id"];
						isOneToOne: false;
						referencedRelation: "tour_options";
						referencedColumns: ["id"];
					},
				];
			};
			coupon_usages: {
				Row: {
					booking_id: string;
					coupon_id: number;
					id: number;
					used_at: string | null;
					user_id: string | null;
				};
				Insert: {
					booking_id: string;
					coupon_id: number;
					id?: number;
					used_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					booking_id?: string;
					coupon_id?: number;
					id?: number;
					used_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "coupon_usages_booking_id_fkey";
						columns: ["booking_id"];
						isOneToOne: false;
						referencedRelation: "bookings_new";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "coupon_usages_coupon_id_fkey";
						columns: ["coupon_id"];
						isOneToOne: false;
						referencedRelation: "coupons";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "coupon_usages_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "app_users";
						referencedColumns: ["user_id"];
					},
				];
			};
			coupons: {
				Row: {
					code: string;
					coupon_type: Database["public"]["Enums"]["coupon_type"];
					created_at: string | null;
					discount_type: Database["public"]["Enums"]["discount_type"];
					discount_value: number;
					id: number;
					is_active: boolean | null;
					min_subtotal: number | null;
					per_user_limit: number | null;
					total_usage_limit: number | null;
					updated_at: string | null;
					valid_from: string;
					valid_until: string;
				};
				Insert: {
					code: string;
					coupon_type: Database["public"]["Enums"]["coupon_type"];
					created_at?: string | null;
					discount_type: Database["public"]["Enums"]["discount_type"];
					discount_value: number;
					id?: number;
					is_active?: boolean | null;
					min_subtotal?: number | null;
					per_user_limit?: number | null;
					total_usage_limit?: number | null;
					updated_at?: string | null;
					valid_from: string;
					valid_until: string;
				};
				Update: {
					code?: string;
					coupon_type?: Database["public"]["Enums"]["coupon_type"];
					created_at?: string | null;
					discount_type?: Database["public"]["Enums"]["discount_type"];
					discount_value?: number;
					id?: number;
					is_active?: boolean | null;
					min_subtotal?: number | null;
					per_user_limit?: number | null;
					total_usage_limit?: number | null;
					updated_at?: string | null;
					valid_from?: string;
					valid_until?: string;
				};
				Relationships: [];
			};
			hero_sections: {
				Row: {
					id: number;
					image: string;
					name: string;
				};
				Insert: {
					id?: number;
					image: string;
					name: string;
				};
				Update: {
					id?: number;
					image?: string;
					name?: string;
				};
				Relationships: [];
			};
			meta_details: {
				Row: {
					created_at: string | null;
					id: string;
					meta_description: string;
					meta_keywords: string | null;
					meta_title: string;
					updated_at: string | null;
					url_key: string;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					meta_description: string;
					meta_keywords?: string | null;
					meta_title: string;
					updated_at?: string | null;
					url_key: string;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					meta_description?: string;
					meta_keywords?: string | null;
					meta_title?: string;
					updated_at?: string | null;
					url_key?: string;
				};
				Relationships: [];
			};
			participant_types: {
				Row: {
					age_max: number;
					age_min: number;
					created_at: string | null;
					id: number;
					name: string;
				};
				Insert: {
					age_max: number;
					age_min: number;
					created_at?: string | null;
					id?: number;
					name: string;
				};
				Update: {
					age_max?: number;
					age_min?: number;
					created_at?: string | null;
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			payments: {
				Row: {
					checkout_session_id: string | null;
					created_at: string | null;
					currency: string | null;
					id: string;
					paid_amount: number;
					paid_at: string | null;
					payment_intent_id: string | null;
					payment_status: Database["public"]["Enums"]["payment_status_enum"];
				};
				Insert: {
					checkout_session_id?: string | null;
					created_at?: string | null;
					currency?: string | null;
					id?: string;
					paid_amount?: number;
					paid_at?: string | null;
					payment_intent_id?: string | null;
					payment_status?: Database["public"]["Enums"]["payment_status_enum"];
				};
				Update: {
					checkout_session_id?: string | null;
					created_at?: string | null;
					currency?: string | null;
					id?: string;
					paid_amount?: number;
					paid_at?: string | null;
					payment_intent_id?: string | null;
					payment_status?: Database["public"]["Enums"]["payment_status_enum"];
				};
				Relationships: [];
			};
			time_slots: {
				Row: {
					availability_rule_id: number;
					capacity: number;
					created_at: string;
					id: number;
					is_active: boolean;
					label: string;
				};
				Insert: {
					availability_rule_id: number;
					capacity?: number;
					created_at?: string;
					id?: never;
					is_active?: boolean;
					label?: string;
				};
				Update: {
					availability_rule_id?: number;
					capacity?: number;
					created_at?: string;
					id?: never;
					is_active?: boolean;
					label?: string;
				};
				Relationships: [
					{
						foreignKeyName: "time_slots_availability_rule_id_fkey";
						columns: ["availability_rule_id"];
						isOneToOne: false;
						referencedRelation: "availability_rules";
						referencedColumns: ["id"];
					},
				];
			};
			tour_option_prices: {
				Row: {
					created_at: string | null;
					id: number;
					participant_type_id: number;
					price: number;
					tour_option_id: number;
				};
				Insert: {
					created_at?: string | null;
					id?: number;
					participant_type_id: number;
					price: number;
					tour_option_id: number;
				};
				Update: {
					created_at?: string | null;
					id?: number;
					participant_type_id?: number;
					price?: number;
					tour_option_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "tour_option_prices_participant_type_id_fkey";
						columns: ["participant_type_id"];
						isOneToOne: false;
						referencedRelation: "participant_types";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "tour_option_prices_tour_option_id_fkey";
						columns: ["tour_option_id"];
						isOneToOne: false;
						referencedRelation: "tour_options";
						referencedColumns: ["id"];
					},
				];
			};
			tour_options: {
				Row: {
					created_at: string | null;
					exclusions: string | null;
					id: number;
					inclusions: string | null;
					isOpenDated: boolean;
					name: string;
					note: string | null;
					sort_order: number | null;
					tour_id: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					exclusions?: string | null;
					id?: number;
					inclusions?: string | null;
					isOpenDated?: boolean;
					name: string;
					note?: string | null;
					sort_order?: number | null;
					tour_id: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					exclusions?: string | null;
					id?: number;
					inclusions?: string | null;
					isOpenDated?: boolean;
					name?: string;
					note?: string | null;
					sort_order?: number | null;
					tour_id?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "tour_options_tour_id_fkey";
						columns: ["tour_id"];
						isOneToOne: false;
						referencedRelation: "tours";
						referencedColumns: ["id"];
					},
				];
			};
			tour_reviews: {
				Row: {
					booking_id: string;
					comment: string;
					created_at: string;
					id: number;
					is_verified: boolean;
					rating: number;
					tour_id: string;
					user_id: string;
				};
				Insert: {
					booking_id: string;
					comment: string;
					created_at?: string;
					id?: number;
					is_verified?: boolean;
					rating: number;
					tour_id: string;
					user_id: string;
				};
				Update: {
					booking_id?: string;
					comment?: string;
					created_at?: string;
					id?: number;
					is_verified?: boolean;
					rating?: number;
					tour_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "tour_reviews_booking_id_fkey";
						columns: ["booking_id"];
						isOneToOne: false;
						referencedRelation: "bookings_new";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "tour_reviews_tour_id_fkey";
						columns: ["tour_id"];
						isOneToOne: false;
						referencedRelation: "tours";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "tour_reviews_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "app_users";
						referencedColumns: ["user_id"];
					},
				];
			};
			tour_tags: {
				Row: {
					id: number;
					image: string;
					name: string;
				};
				Insert: {
					id?: number;
					image: string;
					name: string;
				};
				Update: {
					id?: number;
					image?: string;
					name?: string;
				};
				Relationships: [];
			};
			tours: {
				Row: {
					added_by: string;
					address_link: string | null;
					address_name: string | null;
					age_health_restrictions: string | null;
					cancellation_policy: number | null;
					city_id: number;
					cover_image: string;
					created_at: string | null;
					duration_minutes: number | null;
					free_cancelation_avilable: boolean | null;
					highlights: string | null;
					id: string;
					images: string[] | null;
					isActive: boolean;
					isFeatured: boolean;
					isWeelChairAccessible: boolean | null;
					know_before_you_go: string | null;
					live_tour_guide: boolean | null;
					live_tour_guide_langs: string | null;
					meta_details_id: string;
					name: string;
					overview: string;
					provider: number | null;
					tour_category_id: number;
					updated_at: string | null;
				};
				Insert: {
					added_by: string;
					address_link?: string | null;
					address_name?: string | null;
					age_health_restrictions?: string | null;
					cancellation_policy?: number | null;
					city_id: number;
					cover_image: string;
					created_at?: string | null;
					duration_minutes?: number | null;
					free_cancelation_avilable?: boolean | null;
					highlights?: string | null;
					id?: string;
					images?: string[] | null;
					isActive?: boolean;
					isFeatured?: boolean;
					isWeelChairAccessible?: boolean | null;
					know_before_you_go?: string | null;
					live_tour_guide?: boolean | null;
					live_tour_guide_langs?: string | null;
					meta_details_id: string;
					name: string;
					overview: string;
					provider?: number | null;
					tour_category_id: number;
					updated_at?: string | null;
				};
				Update: {
					added_by?: string;
					address_link?: string | null;
					address_name?: string | null;
					age_health_restrictions?: string | null;
					cancellation_policy?: number | null;
					city_id?: number;
					cover_image?: string;
					created_at?: string | null;
					duration_minutes?: number | null;
					free_cancelation_avilable?: boolean | null;
					highlights?: string | null;
					id?: string;
					images?: string[] | null;
					isActive?: boolean;
					isFeatured?: boolean;
					isWeelChairAccessible?: boolean | null;
					know_before_you_go?: string | null;
					live_tour_guide?: boolean | null;
					live_tour_guide_langs?: string | null;
					meta_details_id?: string;
					name?: string;
					overview?: string;
					provider?: number | null;
					tour_category_id?: number;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "tours_added_by_fkey";
						columns: ["added_by"];
						isOneToOne: false;
						referencedRelation: "app_users";
						referencedColumns: ["user_id"];
					},
					{
						foreignKeyName: "tours_cancellation_policy_fkey";
						columns: ["cancellation_policy"];
						isOneToOne: false;
						referencedRelation: "cancellation_policies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "tours_city_id_fkey";
						columns: ["city_id"];
						isOneToOne: false;
						referencedRelation: "cities";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "tours_meta_details_id_fkey";
						columns: ["meta_details_id"];
						isOneToOne: false;
						referencedRelation: "meta_details";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "tours_provider_fkey";
						columns: ["provider"];
						isOneToOne: false;
						referencedRelation: "activity_providers";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "tours_tour_category_id_fkey";
						columns: ["tour_category_id"];
						isOneToOne: false;
						referencedRelation: "tours_categories";
						referencedColumns: ["id"];
					},
				];
			};
			tours_categories: {
				Row: {
					created_at: string | null;
					id: number;
					image: string;
					meta_details_id: string;
					name: string;
					sort_order: number;
				};
				Insert: {
					created_at?: string | null;
					id?: number;
					image: string;
					meta_details_id: string;
					name: string;
					sort_order?: number;
				};
				Update: {
					created_at?: string | null;
					id?: number;
					image?: string;
					meta_details_id?: string;
					name?: string;
					sort_order?: number;
				};
				Relationships: [
					{
						foreignKeyName: "tours_categories_meta_details_id_fkey";
						columns: ["meta_details_id"];
						isOneToOne: false;
						referencedRelation: "meta_details";
						referencedColumns: ["id"];
					},
				];
			};
			tours_tags: {
				Row: {
					id: number;
					tour_id: string;
					tour_tag_id: number;
				};
				Insert: {
					id?: number;
					tour_id: string;
					tour_tag_id: number;
				};
				Update: {
					id?: number;
					tour_id?: string;
					tour_tag_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "tours_tags_tour_id_fkey";
						columns: ["tour_id"];
						isOneToOne: false;
						referencedRelation: "tours";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "tours_tags_tour_tag_id_fkey";
						columns: ["tour_tag_id"];
						isOneToOne: false;
						referencedRelation: "tour_tags";
						referencedColumns: ["id"];
					},
				];
			};
			user_roles: {
				Row: {
					createdat: string;
					id: number;
					role_name: string;
				};
				Insert: {
					createdat?: string;
					id?: never;
					role_name: string;
				};
				Update: {
					createdat?: string;
					id?: never;
					role_name?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			add_to_cart: {
				Args: { p_cart_items: Json; p_user_id: string };
				Returns: Json;
			};
			delete_collection: { Args: { p_collection_id: number }; Returns: Json };
		};
		Enums: {
			availability_override_type: "CLOSE" | "CAPACITY_CHANGE";
			booking_status_enum: "PENDING" | "CONFIRMED" | "CANCELLED";
			coupon_type: "MANUAL" | "AUTOMATIC";
			discount_type: "PERCENTAGE" | "FIXED_AMOUNT";
			payment_status_enum: "PENDING" | "PARTIAL" | "PAID" | "REFUNDED" | "FAILED" | "CANCELLED";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {
			availability_override_type: ["CLOSE", "CAPACITY_CHANGE"],
			booking_status_enum: ["PENDING", "CONFIRMED", "CANCELLED"],
			coupon_type: ["MANUAL", "AUTOMATIC"],
			discount_type: ["PERCENTAGE", "FIXED_AMOUNT"],
			payment_status_enum: ["PENDING", "PARTIAL", "PAID", "REFUNDED", "FAILED", "CANCELLED"],
		},
	},
} as const;
