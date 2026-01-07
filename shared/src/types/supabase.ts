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
					created_at: string | null;
					first_name: string;
					last_name: string;
					phone_number: string | null;
					role: number;
					status: boolean;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					first_name: string;
					last_name: string;
					phone_number?: string | null;
					role: number;
					status?: boolean;
					user_id: string;
				};
				Update: {
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
			cache_invalidation_events: {
				Row: {
					created_at: string;
					id: string;
					keys: string[];
					processed: boolean;
					target: Database["public"]["Enums"]["cache_invalidation_target"];
				};
				Insert: {
					created_at?: string;
					id?: string;
					keys: string[];
					processed?: boolean;
					target: Database["public"]["Enums"]["cache_invalidation_target"];
				};
				Update: {
					created_at?: string;
					id?: string;
					keys?: string[];
					processed?: boolean;
					target?: Database["public"]["Enums"]["cache_invalidation_target"];
				};
				Relationships: [];
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
			tour_availabilities: {
				Row: {
					created_at: string | null;
					date: string;
					id: number;
					isActive: boolean;
					tour_option_id: number;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					date: string;
					id?: number;
					isActive?: boolean;
					tour_option_id: number;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					date?: string;
					id?: number;
					isActive?: boolean;
					tour_option_id?: number;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "tour_availabilities_tour_option_id_fkey";
						columns: ["tour_option_id"];
						isOneToOne: false;
						referencedRelation: "tour_options";
						referencedColumns: ["id"];
					},
				];
			};
			tour_availability_slots: {
				Row: {
					availability_id: number;
					available_seats: number | null;
					id: number;
					seat_type: Database["public"]["Enums"]["timeslot_seat_type"];
					time_slot_id: number;
				};
				Insert: {
					availability_id: number;
					available_seats?: number | null;
					id?: number;
					seat_type: Database["public"]["Enums"]["timeslot_seat_type"];
					time_slot_id: number;
				};
				Update: {
					availability_id?: number;
					available_seats?: number | null;
					id?: number;
					seat_type?: Database["public"]["Enums"]["timeslot_seat_type"];
					time_slot_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "tour_availability_slots_availability_id_fkey";
						columns: ["availability_id"];
						isOneToOne: false;
						referencedRelation: "tour_availabilities";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "tour_availability_slots_time_slot_id_fkey";
						columns: ["time_slot_id"];
						isOneToOne: false;
						referencedRelation: "tour_time_slots";
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
			tour_time_slots: {
				Row: {
					created_at: string | null;
					id: number;
					label: string | null;
					sort_order: number;
					time: string;
				};
				Insert: {
					created_at?: string | null;
					id?: number;
					label?: string | null;
					sort_order?: number;
					time: string;
				};
				Update: {
					created_at?: string | null;
					id?: number;
					label?: string | null;
					sort_order?: number;
					time?: string;
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
			[_ in never]: never;
		};
		Enums: {
			cache_invalidation_target: "front" | "admin" | "both";
			timeslot_seat_type: "UNLIMITED" | "LIMITED";
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
			cache_invalidation_target: ["front", "admin", "both"],
			timeslot_seat_type: ["UNLIMITED", "LIMITED"],
		},
	},
} as const;
