create type "public"."availability_override_type" as enum ('CLOSE', 'CAPACITY_CHANGE');

create type "public"."coupon_type" as enum ('MANUAL', 'AUTOMATIC');

create type "public"."discount_type" as enum ('PERCENTAGE', 'FIXED_AMOUNT');

create sequence "public"."cart_items_id_seq";

create sequence "public"."cart_items_quantities_id_seq";

create sequence "public"."carts_id_seq";

create sequence "public"."coupon_tours_id_seq";

create sequence "public"."coupon_usages_id_seq";

create sequence "public"."coupons_id_seq";

drop trigger if exists "update_tour_availabilities_updated_at" on "public"."tour_availabilities";

drop trigger if exists "trg_ensure_available_seats_for_limited" on "public"."tour_availability_slots";

revoke delete on table "public"."cache_invalidation_events" from "anon";

revoke insert on table "public"."cache_invalidation_events" from "anon";

revoke references on table "public"."cache_invalidation_events" from "anon";

revoke select on table "public"."cache_invalidation_events" from "anon";

revoke trigger on table "public"."cache_invalidation_events" from "anon";

revoke truncate on table "public"."cache_invalidation_events" from "anon";

revoke update on table "public"."cache_invalidation_events" from "anon";

revoke delete on table "public"."cache_invalidation_events" from "authenticated";

revoke insert on table "public"."cache_invalidation_events" from "authenticated";

revoke references on table "public"."cache_invalidation_events" from "authenticated";

revoke select on table "public"."cache_invalidation_events" from "authenticated";

revoke trigger on table "public"."cache_invalidation_events" from "authenticated";

revoke truncate on table "public"."cache_invalidation_events" from "authenticated";

revoke update on table "public"."cache_invalidation_events" from "authenticated";

revoke delete on table "public"."cache_invalidation_events" from "service_role";

revoke insert on table "public"."cache_invalidation_events" from "service_role";

revoke references on table "public"."cache_invalidation_events" from "service_role";

revoke select on table "public"."cache_invalidation_events" from "service_role";

revoke trigger on table "public"."cache_invalidation_events" from "service_role";

revoke truncate on table "public"."cache_invalidation_events" from "service_role";

revoke update on table "public"."cache_invalidation_events" from "service_role";

revoke delete on table "public"."tour_availabilities" from "anon";

revoke insert on table "public"."tour_availabilities" from "anon";

revoke references on table "public"."tour_availabilities" from "anon";

revoke select on table "public"."tour_availabilities" from "anon";

revoke trigger on table "public"."tour_availabilities" from "anon";

revoke truncate on table "public"."tour_availabilities" from "anon";

revoke update on table "public"."tour_availabilities" from "anon";

revoke delete on table "public"."tour_availabilities" from "authenticated";

revoke insert on table "public"."tour_availabilities" from "authenticated";

revoke references on table "public"."tour_availabilities" from "authenticated";

revoke select on table "public"."tour_availabilities" from "authenticated";

revoke trigger on table "public"."tour_availabilities" from "authenticated";

revoke truncate on table "public"."tour_availabilities" from "authenticated";

revoke update on table "public"."tour_availabilities" from "authenticated";

revoke delete on table "public"."tour_availabilities" from "service_role";

revoke insert on table "public"."tour_availabilities" from "service_role";

revoke references on table "public"."tour_availabilities" from "service_role";

revoke select on table "public"."tour_availabilities" from "service_role";

revoke trigger on table "public"."tour_availabilities" from "service_role";

revoke truncate on table "public"."tour_availabilities" from "service_role";

revoke update on table "public"."tour_availabilities" from "service_role";

revoke delete on table "public"."tour_availability_slots" from "anon";

revoke insert on table "public"."tour_availability_slots" from "anon";

revoke references on table "public"."tour_availability_slots" from "anon";

revoke select on table "public"."tour_availability_slots" from "anon";

revoke trigger on table "public"."tour_availability_slots" from "anon";

revoke truncate on table "public"."tour_availability_slots" from "anon";

revoke update on table "public"."tour_availability_slots" from "anon";

revoke delete on table "public"."tour_availability_slots" from "authenticated";

revoke insert on table "public"."tour_availability_slots" from "authenticated";

revoke references on table "public"."tour_availability_slots" from "authenticated";

revoke select on table "public"."tour_availability_slots" from "authenticated";

revoke trigger on table "public"."tour_availability_slots" from "authenticated";

revoke truncate on table "public"."tour_availability_slots" from "authenticated";

revoke update on table "public"."tour_availability_slots" from "authenticated";

revoke delete on table "public"."tour_availability_slots" from "service_role";

revoke insert on table "public"."tour_availability_slots" from "service_role";

revoke references on table "public"."tour_availability_slots" from "service_role";

revoke select on table "public"."tour_availability_slots" from "service_role";

revoke trigger on table "public"."tour_availability_slots" from "service_role";

revoke truncate on table "public"."tour_availability_slots" from "service_role";

revoke update on table "public"."tour_availability_slots" from "service_role";

revoke delete on table "public"."tour_time_slots" from "anon";

revoke insert on table "public"."tour_time_slots" from "anon";

revoke references on table "public"."tour_time_slots" from "anon";

revoke select on table "public"."tour_time_slots" from "anon";

revoke trigger on table "public"."tour_time_slots" from "anon";

revoke truncate on table "public"."tour_time_slots" from "anon";

revoke update on table "public"."tour_time_slots" from "anon";

revoke delete on table "public"."tour_time_slots" from "authenticated";

revoke insert on table "public"."tour_time_slots" from "authenticated";

revoke references on table "public"."tour_time_slots" from "authenticated";

revoke select on table "public"."tour_time_slots" from "authenticated";

revoke trigger on table "public"."tour_time_slots" from "authenticated";

revoke truncate on table "public"."tour_time_slots" from "authenticated";

revoke update on table "public"."tour_time_slots" from "authenticated";

revoke delete on table "public"."tour_time_slots" from "service_role";

revoke insert on table "public"."tour_time_slots" from "service_role";

revoke references on table "public"."tour_time_slots" from "service_role";

revoke select on table "public"."tour_time_slots" from "service_role";

revoke trigger on table "public"."tour_time_slots" from "service_role";

revoke truncate on table "public"."tour_time_slots" from "service_role";

revoke update on table "public"."tour_time_slots" from "service_role";

alter table "public"."cache_invalidation_events" drop constraint "cache_invalidation_events_id_key";

alter table "public"."tour_availabilities" drop constraint "tour_availabilities_id_key";

alter table "public"."tour_availabilities" drop constraint "tour_availabilities_tour_option_id_fkey";

alter table "public"."tour_availability_slots" drop constraint "tour_availability_slots_avail_time_unique";

alter table "public"."tour_availability_slots" drop constraint "tour_availability_slots_availability_id_fkey";

alter table "public"."tour_availability_slots" drop constraint "tour_availability_slots_id_key";

alter table "public"."tour_availability_slots" drop constraint "tour_availability_slots_time_slot_id_fkey";

alter table "public"."tour_time_slots" drop constraint "tour_time_slots_id_key";

drop function if exists "public"."cleanup_old_tour_availabilities"();

drop function if exists "public"."ensure_available_seats_for_limited"();

drop function if exists "public"."get_tours_with_active_availability_on_date"(p_date date);

alter table "public"."cache_invalidation_events" drop constraint "cache_invalidation_events_pkey";

alter table "public"."tour_availabilities" drop constraint "tour_availabilities_pkey";

alter table "public"."tour_availability_slots" drop constraint "tour_availability_slots_pkey";

alter table "public"."tour_time_slots" drop constraint "tour_time_slots_pkey";

drop index if exists "public"."cache_invalidation_events_id_key";

drop index if exists "public"."cache_invalidation_events_pkey";

drop index if exists "public"."idx_tour_availabilities_date";

drop index if exists "public"."idx_tour_availabilities_tour_option_id";

drop index if exists "public"."idx_tour_availability_slots_availability_id";

drop index if exists "public"."idx_unique_availability_timeslot";

drop index if exists "public"."tour_availabilities_id_key";

drop index if exists "public"."tour_availabilities_pkey";

drop index if exists "public"."tour_availabilities_unique_option_date";

drop index if exists "public"."tour_availability_slots_avail_time_key";

drop index if exists "public"."tour_availability_slots_avail_time_unique";

drop index if exists "public"."tour_availability_slots_id_key";

drop index if exists "public"."tour_availability_slots_pkey";

drop index if exists "public"."tour_time_slots_id_key";

drop index if exists "public"."tour_time_slots_pkey";

drop table "public"."cache_invalidation_events";

drop table "public"."tour_availabilities";

drop table "public"."tour_availability_slots";

drop table "public"."tour_time_slots";

alter type "public"."payment_status_enum" rename to "payment_status_enum__old_version_to_be_dropped";

create type "public"."payment_status_enum" as enum ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED', 'CANCELLED');


  create table "public"."availability_overrides" (
    "id" bigint generated always as identity not null,
    "tour_option_id" bigint not null,
    "date" date not null,
    "time_slot_id" bigint,
    "override_type" public.availability_override_type not null,
    "new_capacity" integer,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."availability_rules" (
    "id" bigint generated by default as identity not null,
    "tour_option_id" bigint not null,
    "start_date" date not null,
    "end_date" date not null,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "weekdays" smallint[] not null
      );



  create table "public"."booking_items" (
    "id" uuid not null default gen_random_uuid(),
    "booking_id" uuid not null,
    "tour_option_id" integer not null,
    "preffered_date" date,
    "preffered_timeslot" text,
    "confirmed_date" date,
    "confirmed_timeslot" text,
    "price_overriden" boolean default false,
    "pricing_note" text
      );



  create table "public"."booking_participants_new" (
    "id" uuid not null default gen_random_uuid(),
    "booking_item_id" uuid not null,
    "participant_type_id" bigint not null,
    "quantity" integer not null,
    "unit_price" numeric(12,2) not null
      );



  create table "public"."bookings_new" (
    "id" uuid not null default gen_random_uuid(),
    "booking_ref" text not null,
    "booking_status" public.booking_status_enum not null default 'PENDING'::public.booking_status_enum,
    "customer_name" text,
    "customer_email" text,
    "customer_phone" text,
    "admin_note" text,
    "subtotal_amount" numeric(12,2) not null default 0,
    "discount" numeric(12,2) not null default 0,
    "taxes" numeric(12,2) not null default 0,
    "total" numeric(12,2) not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "cancelled_at" timestamp with time zone,
    "added_by" uuid,
    "payment_id" uuid,
    "applied_coupon_id" bigint
      );



  create table "public"."cart_items" (
    "id" bigint not null default nextval('public.cart_items_id_seq'::regclass),
    "cart_id" bigint not null,
    "tour_option_id" integer not null,
    "preferred_date" date,
    "preferred_timeslot" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."cart_items_quantities" (
    "id" bigint not null default nextval('public.cart_items_quantities_id_seq'::regclass),
    "cart_item_id" bigint not null,
    "participant_type_id" integer not null,
    "quantity" integer not null
      );



  create table "public"."carts" (
    "id" bigint not null default nextval('public.carts_id_seq'::regclass),
    "user_id" uuid,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."collection_cities" (
    "id" bigint generated by default as identity not null,
    "city_id" bigint not null,
    "collection_id" bigint not null
      );



  create table "public"."collection_tours" (
    "id" bigint generated by default as identity not null,
    "tour_id" uuid not null,
    "collection_id" bigint not null
      );



  create table "public"."collections" (
    "id" bigint generated by default as identity not null,
    "name" text not null,
    "description" text,
    "isFeatured" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."coupon_tours" (
    "id" bigint not null default nextval('public.coupon_tours_id_seq'::regclass),
    "coupon_id" bigint not null,
    "tour_option_id" bigint not null
      );



  create table "public"."coupon_usages" (
    "id" bigint not null default nextval('public.coupon_usages_id_seq'::regclass),
    "coupon_id" bigint not null,
    "booking_id" uuid not null,
    "user_id" uuid,
    "used_at" timestamp with time zone default now()
      );



  create table "public"."coupons" (
    "id" bigint not null default nextval('public.coupons_id_seq'::regclass),
    "code" text not null,
    "coupon_type" public.coupon_type not null,
    "discount_type" public.discount_type not null,
    "discount_value" numeric(10,2) not null,
    "valid_from" timestamp with time zone not null,
    "valid_until" timestamp with time zone not null,
    "min_subtotal" numeric(10,2),
    "total_usage_limit" integer,
    "per_user_limit" integer,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."payments" (
    "id" uuid not null default gen_random_uuid(),
    "payment_intent_id" text,
    "checkout_session_id" text,
    "paid_amount" numeric(12,2) not null default 0,
    "currency" text default 'PKR'::text,
    "payment_status" public.payment_status_enum not null default 'PENDING'::public.payment_status_enum,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."time_slots" (
    "id" bigint generated always as identity not null,
    "availability_rule_id" bigint not null,
    "label" text not null default 'N/A'::text,
    "capacity" integer not null default 0,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."tour_reviews" (
    "id" bigint generated by default as identity not null,
    "tour_id" uuid not null,
    "booking_id" uuid not null,
    "user_id" uuid not null,
    "rating" smallint not null,
    "comment" text not null,
    "is_verified" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."tour_reviews" enable row level security;

alter table "public"."bookings" alter column payment_status type "public"."payment_status_enum" using payment_status::text::"public"."payment_status_enum";

drop type "public"."payment_status_enum__old_version_to_be_dropped";

alter table "public"."app_users" add column "country" text;

alter table "public"."bookings" add column "added_by" uuid;

alter table "public"."bookings" add column "checkout_session_id" text;

alter table "public"."bookings" alter column "payment_status" drop default;

alter sequence "public"."cart_items_id_seq" owned by "public"."cart_items"."id";

alter sequence "public"."cart_items_quantities_id_seq" owned by "public"."cart_items_quantities"."id";

alter sequence "public"."carts_id_seq" owned by "public"."carts"."id";

alter sequence "public"."coupon_tours_id_seq" owned by "public"."coupon_tours"."id";

alter sequence "public"."coupon_usages_id_seq" owned by "public"."coupon_usages"."id";

alter sequence "public"."coupons_id_seq" owned by "public"."coupons"."id";

drop sequence if exists "public"."tour_availabilities_id_seq";

drop sequence if exists "public"."tour_availability_slots_id_seq";

drop sequence if exists "public"."tour_time_slots_id_seq";

drop type "public"."cache_invalidation_target";

drop type "public"."timeslot_seat_type";

CREATE UNIQUE INDEX availability_overrides_pkey ON public.availability_overrides USING btree (id);

CREATE UNIQUE INDEX availability_rules_pkey ON public.availability_rules USING btree (id);

CREATE UNIQUE INDEX booking_items_pkey ON public.booking_items USING btree (id);

CREATE INDEX booking_participants_new_booking_id_idx ON public.booking_participants_new USING btree (booking_item_id);

CREATE INDEX booking_participants_new_participant_type_id_idx ON public.booking_participants_new USING btree (participant_type_id);

CREATE UNIQUE INDEX booking_participants_new_pkey ON public.booking_participants_new USING btree (id);

CREATE INDEX bookings_new_booking_ref_idx ON public.bookings_new USING btree (booking_ref);

CREATE UNIQUE INDEX bookings_new_booking_ref_key ON public.bookings_new USING btree (booking_ref);

CREATE INDEX bookings_new_booking_status_idx ON public.bookings_new USING btree (booking_status);

CREATE INDEX bookings_new_customer_email_idx ON public.bookings_new USING btree (customer_email);

CREATE UNIQUE INDEX bookings_new_pkey ON public.bookings_new USING btree (id);

CREATE UNIQUE INDEX cart_items_pkey ON public.cart_items USING btree (id);

CREATE UNIQUE INDEX cart_items_quantities_pkey ON public.cart_items_quantities USING btree (id);

CREATE UNIQUE INDEX carts_pkey ON public.carts USING btree (id);

CREATE UNIQUE INDEX carts_user_id_unique ON public.carts USING btree (user_id);

CREATE UNIQUE INDEX collection_cities_pkey ON public.collection_cities USING btree (id);

CREATE UNIQUE INDEX collection_tours_pkey ON public.collection_tours USING btree (id);

CREATE UNIQUE INDEX collections_pkey ON public.collections USING btree (id);

CREATE UNIQUE INDEX coupon_tours_coupon_id_tour_option_id_key ON public.coupon_tours USING btree (coupon_id, tour_option_id);

CREATE UNIQUE INDEX coupon_tours_pkey ON public.coupon_tours USING btree (id);

CREATE UNIQUE INDEX coupon_usages_coupon_id_booking_id_key ON public.coupon_usages USING btree (coupon_id, booking_id);

CREATE UNIQUE INDEX coupon_usages_pkey ON public.coupon_usages USING btree (id);

CREATE UNIQUE INDEX coupons_code_key ON public.coupons USING btree (code);

CREATE UNIQUE INDEX coupons_pkey ON public.coupons USING btree (id);

CREATE INDEX idx_availability_overrides_lookup ON public.availability_overrides USING btree (tour_option_id, date);

CREATE INDEX idx_availability_overrides_slot ON public.availability_overrides USING btree (time_slot_id);

CREATE INDEX idx_availability_rules_tour_option ON public.availability_rules USING btree (tour_option_id);

CREATE INDEX idx_booking_items_booking_id ON public.booking_items USING btree (booking_id);

CREATE INDEX idx_booking_participants_new_booking_item_id ON public.booking_participants_new USING btree (booking_item_id);

CREATE INDEX idx_cart_items_cart_id ON public.cart_items USING btree (cart_id);

CREATE INDEX idx_cart_items_quantities_cart_item_id ON public.cart_items_quantities USING btree (cart_item_id);

CREATE INDEX idx_carts_user_id ON public.carts USING btree (user_id);

CREATE INDEX idx_coupon_tours_coupon_id ON public.coupon_tours USING btree (coupon_id);

CREATE INDEX idx_coupon_tours_tour_option_id ON public.coupon_tours USING btree (tour_option_id);

CREATE INDEX idx_coupon_usages_booking_id ON public.coupon_usages USING btree (booking_id);

CREATE INDEX idx_coupon_usages_coupon_id ON public.coupon_usages USING btree (coupon_id);

CREATE INDEX idx_coupons_code ON public.coupons USING btree (code);

CREATE INDEX idx_coupons_valid_dates ON public.coupons USING btree (valid_from, valid_until);

CREATE INDEX idx_payments_checkout_session_id ON public.payments USING btree (checkout_session_id);

CREATE INDEX idx_time_slots_rule ON public.time_slots USING btree (availability_rule_id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX time_slots_pkey ON public.time_slots USING btree (id);

CREATE UNIQUE INDEX tour_reviews_pkey ON public.tour_reviews USING btree (id);

alter table "public"."availability_overrides" add constraint "availability_overrides_pkey" PRIMARY KEY using index "availability_overrides_pkey";

alter table "public"."availability_rules" add constraint "availability_rules_pkey" PRIMARY KEY using index "availability_rules_pkey";

alter table "public"."booking_items" add constraint "booking_items_pkey" PRIMARY KEY using index "booking_items_pkey";

alter table "public"."booking_participants_new" add constraint "booking_participants_new_pkey" PRIMARY KEY using index "booking_participants_new_pkey";

alter table "public"."bookings_new" add constraint "bookings_new_pkey" PRIMARY KEY using index "bookings_new_pkey";

alter table "public"."cart_items" add constraint "cart_items_pkey" PRIMARY KEY using index "cart_items_pkey";

alter table "public"."cart_items_quantities" add constraint "cart_items_quantities_pkey" PRIMARY KEY using index "cart_items_quantities_pkey";

alter table "public"."carts" add constraint "carts_pkey" PRIMARY KEY using index "carts_pkey";

alter table "public"."collection_cities" add constraint "collection_cities_pkey" PRIMARY KEY using index "collection_cities_pkey";

alter table "public"."collection_tours" add constraint "collection_tours_pkey" PRIMARY KEY using index "collection_tours_pkey";

alter table "public"."collections" add constraint "collections_pkey" PRIMARY KEY using index "collections_pkey";

alter table "public"."coupon_tours" add constraint "coupon_tours_pkey" PRIMARY KEY using index "coupon_tours_pkey";

alter table "public"."coupon_usages" add constraint "coupon_usages_pkey" PRIMARY KEY using index "coupon_usages_pkey";

alter table "public"."coupons" add constraint "coupons_pkey" PRIMARY KEY using index "coupons_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."time_slots" add constraint "time_slots_pkey" PRIMARY KEY using index "time_slots_pkey";

alter table "public"."tour_reviews" add constraint "tour_reviews_pkey" PRIMARY KEY using index "tour_reviews_pkey";

alter table "public"."availability_overrides" add constraint "availability_overrides_capacity_check" CHECK ((((override_type = 'CAPACITY_CHANGE'::public.availability_override_type) AND (new_capacity IS NOT NULL)) OR ((override_type = 'CLOSE'::public.availability_override_type) AND (new_capacity IS NULL)))) not valid;

alter table "public"."availability_overrides" validate constraint "availability_overrides_capacity_check";

alter table "public"."availability_overrides" add constraint "availability_overrides_new_capacity_check" CHECK ((new_capacity >= 0)) not valid;

alter table "public"."availability_overrides" validate constraint "availability_overrides_new_capacity_check";

alter table "public"."availability_overrides" add constraint "availability_overrides_time_slot_id_fkey" FOREIGN KEY (time_slot_id) REFERENCES public.time_slots(id) ON DELETE CASCADE not valid;

alter table "public"."availability_overrides" validate constraint "availability_overrides_time_slot_id_fkey";

alter table "public"."availability_overrides" add constraint "availability_overrides_tour_option_id_fkey" FOREIGN KEY (tour_option_id) REFERENCES public.tour_options(id) ON DELETE CASCADE not valid;

alter table "public"."availability_overrides" validate constraint "availability_overrides_tour_option_id_fkey";

alter table "public"."availability_rules" add constraint "availability_rules_date_check" CHECK ((start_date <= end_date)) not valid;

alter table "public"."availability_rules" validate constraint "availability_rules_date_check";

alter table "public"."availability_rules" add constraint "availability_rules_tour_option_id_fkey" FOREIGN KEY (tour_option_id) REFERENCES public.tour_options(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."availability_rules" validate constraint "availability_rules_tour_option_id_fkey";

alter table "public"."availability_rules" add constraint "availability_rules_weekdays_check" CHECK (((array_length(weekdays, 1) > 0) AND ((weekdays)::integer[] <@ ARRAY[1, 2, 3, 4, 5, 6, 7]))) not valid;

alter table "public"."availability_rules" validate constraint "availability_rules_weekdays_check";

alter table "public"."booking_items" add constraint "booking_items_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings_new(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."booking_items" validate constraint "booking_items_booking_id_fkey";

alter table "public"."booking_items" add constraint "booking_items_tour_option_id_fkey" FOREIGN KEY (tour_option_id) REFERENCES public.tour_options(id) ON DELETE SET NULL not valid;

alter table "public"."booking_items" validate constraint "booking_items_tour_option_id_fkey";

alter table "public"."booking_participants_new" add constraint "booking_participants_new_booking_item_id_fkey" FOREIGN KEY (booking_item_id) REFERENCES public.booking_items(id) ON DELETE CASCADE not valid;

alter table "public"."booking_participants_new" validate constraint "booking_participants_new_booking_item_id_fkey";

alter table "public"."booking_participants_new" add constraint "booking_participants_new_participant_type_id_fkey" FOREIGN KEY (participant_type_id) REFERENCES public.participant_types(id) ON DELETE RESTRICT not valid;

alter table "public"."booking_participants_new" validate constraint "booking_participants_new_participant_type_id_fkey";

alter table "public"."booking_participants_new" add constraint "booking_participants_quantity_check" CHECK ((quantity > 0)) not valid;

alter table "public"."booking_participants_new" validate constraint "booking_participants_quantity_check";

alter table "public"."booking_participants_new" add constraint "booking_participants_unit_price_check" CHECK ((unit_price >= (0)::numeric)) not valid;

alter table "public"."booking_participants_new" validate constraint "booking_participants_unit_price_check";

alter table "public"."bookings" add constraint "bookings_added_by_fkey" FOREIGN KEY (added_by) REFERENCES public.app_users(user_id) ON DELETE RESTRICT not valid;

alter table "public"."bookings" validate constraint "bookings_added_by_fkey";

alter table "public"."bookings_new" add constraint "bookings_new_added_by_fkey" FOREIGN KEY (added_by) REFERENCES public.app_users(user_id) ON DELETE RESTRICT not valid;

alter table "public"."bookings_new" validate constraint "bookings_new_added_by_fkey";

alter table "public"."bookings_new" add constraint "bookings_new_applied_coupon_id_fkey" FOREIGN KEY (applied_coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL not valid;

alter table "public"."bookings_new" validate constraint "bookings_new_applied_coupon_id_fkey";

alter table "public"."bookings_new" add constraint "bookings_new_booking_ref_key" UNIQUE using index "bookings_new_booking_ref_key";

alter table "public"."bookings_new" add constraint "bookings_new_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL not valid;

alter table "public"."bookings_new" validate constraint "bookings_new_payment_id_fkey";

alter table "public"."cart_items" add constraint "cart_items_cart_id_fkey" FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE not valid;

alter table "public"."cart_items" validate constraint "cart_items_cart_id_fkey";

alter table "public"."cart_items" add constraint "cart_items_tour_option_id_fkey" FOREIGN KEY (tour_option_id) REFERENCES public.tour_options(id) ON DELETE CASCADE not valid;

alter table "public"."cart_items" validate constraint "cart_items_tour_option_id_fkey";

alter table "public"."cart_items_quantities" add constraint "cart_items_quantities_cart_item_id_fkey" FOREIGN KEY (cart_item_id) REFERENCES public.cart_items(id) ON DELETE CASCADE not valid;

alter table "public"."cart_items_quantities" validate constraint "cart_items_quantities_cart_item_id_fkey";

alter table "public"."cart_items_quantities" add constraint "cart_items_quantities_participant_type_id_fkey" FOREIGN KEY (participant_type_id) REFERENCES public.participant_types(id) not valid;

alter table "public"."cart_items_quantities" validate constraint "cart_items_quantities_participant_type_id_fkey";

alter table "public"."carts" add constraint "carts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_users(user_id) ON DELETE CASCADE not valid;

alter table "public"."carts" validate constraint "carts_user_id_fkey";

alter table "public"."carts" add constraint "carts_user_id_unique" UNIQUE using index "carts_user_id_unique";

alter table "public"."collection_cities" add constraint "collection_cities_city_id_fkey" FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."collection_cities" validate constraint "collection_cities_city_id_fkey";

alter table "public"."collection_cities" add constraint "collection_cities_collection_id_fkey" FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."collection_cities" validate constraint "collection_cities_collection_id_fkey";

alter table "public"."collection_tours" add constraint "collection_tours_collection_id_fkey" FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."collection_tours" validate constraint "collection_tours_collection_id_fkey";

alter table "public"."collection_tours" add constraint "collection_tours_tour_id_fkey" FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."collection_tours" validate constraint "collection_tours_tour_id_fkey";

alter table "public"."coupon_tours" add constraint "coupon_tours_coupon_id_fkey" FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE not valid;

alter table "public"."coupon_tours" validate constraint "coupon_tours_coupon_id_fkey";

alter table "public"."coupon_tours" add constraint "coupon_tours_coupon_id_tour_option_id_key" UNIQUE using index "coupon_tours_coupon_id_tour_option_id_key";

alter table "public"."coupon_tours" add constraint "coupon_tours_tour_option_id_fkey" FOREIGN KEY (tour_option_id) REFERENCES public.tour_options(id) ON DELETE CASCADE not valid;

alter table "public"."coupon_tours" validate constraint "coupon_tours_tour_option_id_fkey";

alter table "public"."coupon_usages" add constraint "coupon_usages_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings_new(id) ON DELETE CASCADE not valid;

alter table "public"."coupon_usages" validate constraint "coupon_usages_booking_id_fkey";

alter table "public"."coupon_usages" add constraint "coupon_usages_coupon_id_booking_id_key" UNIQUE using index "coupon_usages_coupon_id_booking_id_key";

alter table "public"."coupon_usages" add constraint "coupon_usages_coupon_id_fkey" FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE not valid;

alter table "public"."coupon_usages" validate constraint "coupon_usages_coupon_id_fkey";

alter table "public"."coupon_usages" add constraint "coupon_usages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_users(user_id) ON DELETE SET NULL not valid;

alter table "public"."coupon_usages" validate constraint "coupon_usages_user_id_fkey";

alter table "public"."coupons" add constraint "coupons_code_key" UNIQUE using index "coupons_code_key";

alter table "public"."coupons" add constraint "coupons_discount_value_check" CHECK ((discount_value > (0)::numeric)) not valid;

alter table "public"."coupons" validate constraint "coupons_discount_value_check";

alter table "public"."time_slots" add constraint "time_slots_availability_rule_id_fkey" FOREIGN KEY (availability_rule_id) REFERENCES public.availability_rules(id) ON DELETE CASCADE not valid;

alter table "public"."time_slots" validate constraint "time_slots_availability_rule_id_fkey";

alter table "public"."time_slots" add constraint "time_slots_capacity_check" CHECK ((capacity >= 0)) not valid;

alter table "public"."time_slots" validate constraint "time_slots_capacity_check";

alter table "public"."tour_reviews" add constraint "tour_reviews_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings_new(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."tour_reviews" validate constraint "tour_reviews_booking_id_fkey";

alter table "public"."tour_reviews" add constraint "tour_reviews_tour_id_fkey" FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."tour_reviews" validate constraint "tour_reviews_tour_id_fkey";

alter table "public"."tour_reviews" add constraint "tour_reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."tour_reviews" validate constraint "tour_reviews_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_to_cart(p_user_id uuid, p_cart_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_cart_id bigint;
    v_cart_item_id bigint;
    v_item jsonb;
    v_qty jsonb;
BEGIN
    -- Get user's cart
    SELECT id INTO v_cart_id 
    FROM public.carts 
    WHERE user_id = p_user_id 
    LIMIT 1;

    IF v_cart_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cart not found for user');
    END IF;

    -- Start transaction
    BEGIN
        -- Loop through every item in the payload
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
        LOOP
            -- 1. Insert cart_item
            INSERT INTO public.cart_items (
                cart_id,
                tour_option_id,
                preferred_date,
                preferred_timeslot
            )
            VALUES (
                v_cart_id,
                (v_item->>'tour_option_id')::integer,
                (v_item->>'preferred_date')::date,
                v_item->>'preferred_timeslot'
            )
            RETURNING id INTO v_cart_item_id;

            -- 2. Insert all quantities for this item
            FOR v_qty IN SELECT * FROM jsonb_array_elements(v_item->'quantities')
            LOOP
                IF (v_qty->>'quantity')::integer > 0 THEN
                    INSERT INTO public.cart_items_quantities (
                        cart_item_id,
                        participant_type_id,
                        quantity
                    )
                    VALUES (
                        v_cart_item_id,
                        (v_qty->>'participant_type_id')::integer,
                        (v_qty->>'quantity')::integer
                    );
                END IF;
            END LOOP;
        END LOOP;

        -- Everything succeeded
        RETURN jsonb_build_object('success', true);

    EXCEPTION WHEN OTHERS THEN
        -- Automatic full rollback (Postgres magic)
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
    END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_cart_for_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.carts (user_id, expires_at)
    VALUES (NEW.user_id, NOW() + INTERVAL '30 days')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_collection(p_collection_id integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_exists boolean;
BEGIN
  -- Check if collection exists (optional but good practice)
  SELECT EXISTS (
    SELECT 1 FROM collections WHERE id = p_collection_id
  ) INTO v_exists;

  IF NOT v_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Collection not found',
      'code', 'not_found'
    );
  END IF;

  -- Everything happens in one transaction (implicit in plpgsql function)
  BEGIN
    -- 1. Delete relations to tours
    DELETE FROM collection_tours
     WHERE collection_id = p_collection_id;

    -- 2. Delete relations to cities (if any)
    DELETE FROM collection_cities
     WHERE collection_id = p_collection_id;

    -- 3. Delete the collection itself
    DELETE FROM collections
     WHERE id = p_collection_id;

    -- If we reached here → success
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Collection and all relations deleted successfully',
      'deleted_collection_id', p_collection_id
    );

  EXCEPTION WHEN OTHERS THEN
    -- Rollback is automatic when exception is raised in function
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Failed to delete collection: ' || SQLERRM,
      'code', 'delete_failed',
      'detail', SQLSTATE
    );
  END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_app_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.app_users (
    user_id,
    first_name,
    last_name,
    role,
    status
  )
  VALUES (NEW.id, '', '', 2, true);
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."availability_overrides" to "anon";

grant insert on table "public"."availability_overrides" to "anon";

grant references on table "public"."availability_overrides" to "anon";

grant select on table "public"."availability_overrides" to "anon";

grant trigger on table "public"."availability_overrides" to "anon";

grant truncate on table "public"."availability_overrides" to "anon";

grant update on table "public"."availability_overrides" to "anon";

grant delete on table "public"."availability_overrides" to "authenticated";

grant insert on table "public"."availability_overrides" to "authenticated";

grant references on table "public"."availability_overrides" to "authenticated";

grant select on table "public"."availability_overrides" to "authenticated";

grant trigger on table "public"."availability_overrides" to "authenticated";

grant truncate on table "public"."availability_overrides" to "authenticated";

grant update on table "public"."availability_overrides" to "authenticated";

grant delete on table "public"."availability_overrides" to "service_role";

grant insert on table "public"."availability_overrides" to "service_role";

grant references on table "public"."availability_overrides" to "service_role";

grant select on table "public"."availability_overrides" to "service_role";

grant trigger on table "public"."availability_overrides" to "service_role";

grant truncate on table "public"."availability_overrides" to "service_role";

grant update on table "public"."availability_overrides" to "service_role";

grant delete on table "public"."availability_rules" to "anon";

grant insert on table "public"."availability_rules" to "anon";

grant references on table "public"."availability_rules" to "anon";

grant select on table "public"."availability_rules" to "anon";

grant trigger on table "public"."availability_rules" to "anon";

grant truncate on table "public"."availability_rules" to "anon";

grant update on table "public"."availability_rules" to "anon";

grant delete on table "public"."availability_rules" to "authenticated";

grant insert on table "public"."availability_rules" to "authenticated";

grant references on table "public"."availability_rules" to "authenticated";

grant select on table "public"."availability_rules" to "authenticated";

grant trigger on table "public"."availability_rules" to "authenticated";

grant truncate on table "public"."availability_rules" to "authenticated";

grant update on table "public"."availability_rules" to "authenticated";

grant delete on table "public"."availability_rules" to "service_role";

grant insert on table "public"."availability_rules" to "service_role";

grant references on table "public"."availability_rules" to "service_role";

grant select on table "public"."availability_rules" to "service_role";

grant trigger on table "public"."availability_rules" to "service_role";

grant truncate on table "public"."availability_rules" to "service_role";

grant update on table "public"."availability_rules" to "service_role";

grant delete on table "public"."booking_items" to "anon";

grant insert on table "public"."booking_items" to "anon";

grant references on table "public"."booking_items" to "anon";

grant select on table "public"."booking_items" to "anon";

grant trigger on table "public"."booking_items" to "anon";

grant truncate on table "public"."booking_items" to "anon";

grant update on table "public"."booking_items" to "anon";

grant delete on table "public"."booking_items" to "authenticated";

grant insert on table "public"."booking_items" to "authenticated";

grant references on table "public"."booking_items" to "authenticated";

grant select on table "public"."booking_items" to "authenticated";

grant trigger on table "public"."booking_items" to "authenticated";

grant truncate on table "public"."booking_items" to "authenticated";

grant update on table "public"."booking_items" to "authenticated";

grant delete on table "public"."booking_items" to "service_role";

grant insert on table "public"."booking_items" to "service_role";

grant references on table "public"."booking_items" to "service_role";

grant select on table "public"."booking_items" to "service_role";

grant trigger on table "public"."booking_items" to "service_role";

grant truncate on table "public"."booking_items" to "service_role";

grant update on table "public"."booking_items" to "service_role";

grant delete on table "public"."booking_participants_new" to "anon";

grant insert on table "public"."booking_participants_new" to "anon";

grant references on table "public"."booking_participants_new" to "anon";

grant select on table "public"."booking_participants_new" to "anon";

grant trigger on table "public"."booking_participants_new" to "anon";

grant truncate on table "public"."booking_participants_new" to "anon";

grant update on table "public"."booking_participants_new" to "anon";

grant delete on table "public"."booking_participants_new" to "authenticated";

grant insert on table "public"."booking_participants_new" to "authenticated";

grant references on table "public"."booking_participants_new" to "authenticated";

grant select on table "public"."booking_participants_new" to "authenticated";

grant trigger on table "public"."booking_participants_new" to "authenticated";

grant truncate on table "public"."booking_participants_new" to "authenticated";

grant update on table "public"."booking_participants_new" to "authenticated";

grant delete on table "public"."booking_participants_new" to "service_role";

grant insert on table "public"."booking_participants_new" to "service_role";

grant references on table "public"."booking_participants_new" to "service_role";

grant select on table "public"."booking_participants_new" to "service_role";

grant trigger on table "public"."booking_participants_new" to "service_role";

grant truncate on table "public"."booking_participants_new" to "service_role";

grant update on table "public"."booking_participants_new" to "service_role";

grant delete on table "public"."bookings_new" to "anon";

grant insert on table "public"."bookings_new" to "anon";

grant references on table "public"."bookings_new" to "anon";

grant select on table "public"."bookings_new" to "anon";

grant trigger on table "public"."bookings_new" to "anon";

grant truncate on table "public"."bookings_new" to "anon";

grant update on table "public"."bookings_new" to "anon";

grant delete on table "public"."bookings_new" to "authenticated";

grant insert on table "public"."bookings_new" to "authenticated";

grant references on table "public"."bookings_new" to "authenticated";

grant select on table "public"."bookings_new" to "authenticated";

grant trigger on table "public"."bookings_new" to "authenticated";

grant truncate on table "public"."bookings_new" to "authenticated";

grant update on table "public"."bookings_new" to "authenticated";

grant delete on table "public"."bookings_new" to "service_role";

grant insert on table "public"."bookings_new" to "service_role";

grant references on table "public"."bookings_new" to "service_role";

grant select on table "public"."bookings_new" to "service_role";

grant trigger on table "public"."bookings_new" to "service_role";

grant truncate on table "public"."bookings_new" to "service_role";

grant update on table "public"."bookings_new" to "service_role";

grant delete on table "public"."cart_items" to "anon";

grant insert on table "public"."cart_items" to "anon";

grant references on table "public"."cart_items" to "anon";

grant select on table "public"."cart_items" to "anon";

grant trigger on table "public"."cart_items" to "anon";

grant truncate on table "public"."cart_items" to "anon";

grant update on table "public"."cart_items" to "anon";

grant delete on table "public"."cart_items" to "authenticated";

grant insert on table "public"."cart_items" to "authenticated";

grant references on table "public"."cart_items" to "authenticated";

grant select on table "public"."cart_items" to "authenticated";

grant trigger on table "public"."cart_items" to "authenticated";

grant truncate on table "public"."cart_items" to "authenticated";

grant update on table "public"."cart_items" to "authenticated";

grant delete on table "public"."cart_items" to "service_role";

grant insert on table "public"."cart_items" to "service_role";

grant references on table "public"."cart_items" to "service_role";

grant select on table "public"."cart_items" to "service_role";

grant trigger on table "public"."cart_items" to "service_role";

grant truncate on table "public"."cart_items" to "service_role";

grant update on table "public"."cart_items" to "service_role";

grant delete on table "public"."cart_items_quantities" to "anon";

grant insert on table "public"."cart_items_quantities" to "anon";

grant references on table "public"."cart_items_quantities" to "anon";

grant select on table "public"."cart_items_quantities" to "anon";

grant trigger on table "public"."cart_items_quantities" to "anon";

grant truncate on table "public"."cart_items_quantities" to "anon";

grant update on table "public"."cart_items_quantities" to "anon";

grant delete on table "public"."cart_items_quantities" to "authenticated";

grant insert on table "public"."cart_items_quantities" to "authenticated";

grant references on table "public"."cart_items_quantities" to "authenticated";

grant select on table "public"."cart_items_quantities" to "authenticated";

grant trigger on table "public"."cart_items_quantities" to "authenticated";

grant truncate on table "public"."cart_items_quantities" to "authenticated";

grant update on table "public"."cart_items_quantities" to "authenticated";

grant delete on table "public"."cart_items_quantities" to "service_role";

grant insert on table "public"."cart_items_quantities" to "service_role";

grant references on table "public"."cart_items_quantities" to "service_role";

grant select on table "public"."cart_items_quantities" to "service_role";

grant trigger on table "public"."cart_items_quantities" to "service_role";

grant truncate on table "public"."cart_items_quantities" to "service_role";

grant update on table "public"."cart_items_quantities" to "service_role";

grant delete on table "public"."carts" to "anon";

grant insert on table "public"."carts" to "anon";

grant references on table "public"."carts" to "anon";

grant select on table "public"."carts" to "anon";

grant trigger on table "public"."carts" to "anon";

grant truncate on table "public"."carts" to "anon";

grant update on table "public"."carts" to "anon";

grant delete on table "public"."carts" to "authenticated";

grant insert on table "public"."carts" to "authenticated";

grant references on table "public"."carts" to "authenticated";

grant select on table "public"."carts" to "authenticated";

grant trigger on table "public"."carts" to "authenticated";

grant truncate on table "public"."carts" to "authenticated";

grant update on table "public"."carts" to "authenticated";

grant delete on table "public"."carts" to "service_role";

grant insert on table "public"."carts" to "service_role";

grant references on table "public"."carts" to "service_role";

grant select on table "public"."carts" to "service_role";

grant trigger on table "public"."carts" to "service_role";

grant truncate on table "public"."carts" to "service_role";

grant update on table "public"."carts" to "service_role";

grant delete on table "public"."collection_cities" to "anon";

grant insert on table "public"."collection_cities" to "anon";

grant references on table "public"."collection_cities" to "anon";

grant select on table "public"."collection_cities" to "anon";

grant trigger on table "public"."collection_cities" to "anon";

grant truncate on table "public"."collection_cities" to "anon";

grant update on table "public"."collection_cities" to "anon";

grant delete on table "public"."collection_cities" to "authenticated";

grant insert on table "public"."collection_cities" to "authenticated";

grant references on table "public"."collection_cities" to "authenticated";

grant select on table "public"."collection_cities" to "authenticated";

grant trigger on table "public"."collection_cities" to "authenticated";

grant truncate on table "public"."collection_cities" to "authenticated";

grant update on table "public"."collection_cities" to "authenticated";

grant delete on table "public"."collection_cities" to "service_role";

grant insert on table "public"."collection_cities" to "service_role";

grant references on table "public"."collection_cities" to "service_role";

grant select on table "public"."collection_cities" to "service_role";

grant trigger on table "public"."collection_cities" to "service_role";

grant truncate on table "public"."collection_cities" to "service_role";

grant update on table "public"."collection_cities" to "service_role";

grant delete on table "public"."collection_tours" to "anon";

grant insert on table "public"."collection_tours" to "anon";

grant references on table "public"."collection_tours" to "anon";

grant select on table "public"."collection_tours" to "anon";

grant trigger on table "public"."collection_tours" to "anon";

grant truncate on table "public"."collection_tours" to "anon";

grant update on table "public"."collection_tours" to "anon";

grant delete on table "public"."collection_tours" to "authenticated";

grant insert on table "public"."collection_tours" to "authenticated";

grant references on table "public"."collection_tours" to "authenticated";

grant select on table "public"."collection_tours" to "authenticated";

grant trigger on table "public"."collection_tours" to "authenticated";

grant truncate on table "public"."collection_tours" to "authenticated";

grant update on table "public"."collection_tours" to "authenticated";

grant delete on table "public"."collection_tours" to "service_role";

grant insert on table "public"."collection_tours" to "service_role";

grant references on table "public"."collection_tours" to "service_role";

grant select on table "public"."collection_tours" to "service_role";

grant trigger on table "public"."collection_tours" to "service_role";

grant truncate on table "public"."collection_tours" to "service_role";

grant update on table "public"."collection_tours" to "service_role";

grant delete on table "public"."collections" to "anon";

grant insert on table "public"."collections" to "anon";

grant references on table "public"."collections" to "anon";

grant select on table "public"."collections" to "anon";

grant trigger on table "public"."collections" to "anon";

grant truncate on table "public"."collections" to "anon";

grant update on table "public"."collections" to "anon";

grant delete on table "public"."collections" to "authenticated";

grant insert on table "public"."collections" to "authenticated";

grant references on table "public"."collections" to "authenticated";

grant select on table "public"."collections" to "authenticated";

grant trigger on table "public"."collections" to "authenticated";

grant truncate on table "public"."collections" to "authenticated";

grant update on table "public"."collections" to "authenticated";

grant delete on table "public"."collections" to "service_role";

grant insert on table "public"."collections" to "service_role";

grant references on table "public"."collections" to "service_role";

grant select on table "public"."collections" to "service_role";

grant trigger on table "public"."collections" to "service_role";

grant truncate on table "public"."collections" to "service_role";

grant update on table "public"."collections" to "service_role";

grant delete on table "public"."coupon_tours" to "anon";

grant insert on table "public"."coupon_tours" to "anon";

grant references on table "public"."coupon_tours" to "anon";

grant select on table "public"."coupon_tours" to "anon";

grant trigger on table "public"."coupon_tours" to "anon";

grant truncate on table "public"."coupon_tours" to "anon";

grant update on table "public"."coupon_tours" to "anon";

grant delete on table "public"."coupon_tours" to "authenticated";

grant insert on table "public"."coupon_tours" to "authenticated";

grant references on table "public"."coupon_tours" to "authenticated";

grant select on table "public"."coupon_tours" to "authenticated";

grant trigger on table "public"."coupon_tours" to "authenticated";

grant truncate on table "public"."coupon_tours" to "authenticated";

grant update on table "public"."coupon_tours" to "authenticated";

grant delete on table "public"."coupon_tours" to "service_role";

grant insert on table "public"."coupon_tours" to "service_role";

grant references on table "public"."coupon_tours" to "service_role";

grant select on table "public"."coupon_tours" to "service_role";

grant trigger on table "public"."coupon_tours" to "service_role";

grant truncate on table "public"."coupon_tours" to "service_role";

grant update on table "public"."coupon_tours" to "service_role";

grant delete on table "public"."coupon_usages" to "anon";

grant insert on table "public"."coupon_usages" to "anon";

grant references on table "public"."coupon_usages" to "anon";

grant select on table "public"."coupon_usages" to "anon";

grant trigger on table "public"."coupon_usages" to "anon";

grant truncate on table "public"."coupon_usages" to "anon";

grant update on table "public"."coupon_usages" to "anon";

grant delete on table "public"."coupon_usages" to "authenticated";

grant insert on table "public"."coupon_usages" to "authenticated";

grant references on table "public"."coupon_usages" to "authenticated";

grant select on table "public"."coupon_usages" to "authenticated";

grant trigger on table "public"."coupon_usages" to "authenticated";

grant truncate on table "public"."coupon_usages" to "authenticated";

grant update on table "public"."coupon_usages" to "authenticated";

grant delete on table "public"."coupon_usages" to "service_role";

grant insert on table "public"."coupon_usages" to "service_role";

grant references on table "public"."coupon_usages" to "service_role";

grant select on table "public"."coupon_usages" to "service_role";

grant trigger on table "public"."coupon_usages" to "service_role";

grant truncate on table "public"."coupon_usages" to "service_role";

grant update on table "public"."coupon_usages" to "service_role";

grant delete on table "public"."coupons" to "anon";

grant insert on table "public"."coupons" to "anon";

grant references on table "public"."coupons" to "anon";

grant select on table "public"."coupons" to "anon";

grant trigger on table "public"."coupons" to "anon";

grant truncate on table "public"."coupons" to "anon";

grant update on table "public"."coupons" to "anon";

grant delete on table "public"."coupons" to "authenticated";

grant insert on table "public"."coupons" to "authenticated";

grant references on table "public"."coupons" to "authenticated";

grant select on table "public"."coupons" to "authenticated";

grant trigger on table "public"."coupons" to "authenticated";

grant truncate on table "public"."coupons" to "authenticated";

grant update on table "public"."coupons" to "authenticated";

grant delete on table "public"."coupons" to "service_role";

grant insert on table "public"."coupons" to "service_role";

grant references on table "public"."coupons" to "service_role";

grant select on table "public"."coupons" to "service_role";

grant trigger on table "public"."coupons" to "service_role";

grant truncate on table "public"."coupons" to "service_role";

grant update on table "public"."coupons" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."time_slots" to "anon";

grant insert on table "public"."time_slots" to "anon";

grant references on table "public"."time_slots" to "anon";

grant select on table "public"."time_slots" to "anon";

grant trigger on table "public"."time_slots" to "anon";

grant truncate on table "public"."time_slots" to "anon";

grant update on table "public"."time_slots" to "anon";

grant delete on table "public"."time_slots" to "authenticated";

grant insert on table "public"."time_slots" to "authenticated";

grant references on table "public"."time_slots" to "authenticated";

grant select on table "public"."time_slots" to "authenticated";

grant trigger on table "public"."time_slots" to "authenticated";

grant truncate on table "public"."time_slots" to "authenticated";

grant update on table "public"."time_slots" to "authenticated";

grant delete on table "public"."time_slots" to "service_role";

grant insert on table "public"."time_slots" to "service_role";

grant references on table "public"."time_slots" to "service_role";

grant select on table "public"."time_slots" to "service_role";

grant trigger on table "public"."time_slots" to "service_role";

grant truncate on table "public"."time_slots" to "service_role";

grant update on table "public"."time_slots" to "service_role";

grant delete on table "public"."tour_reviews" to "anon";

grant insert on table "public"."tour_reviews" to "anon";

grant references on table "public"."tour_reviews" to "anon";

grant select on table "public"."tour_reviews" to "anon";

grant trigger on table "public"."tour_reviews" to "anon";

grant truncate on table "public"."tour_reviews" to "anon";

grant update on table "public"."tour_reviews" to "anon";

grant delete on table "public"."tour_reviews" to "authenticated";

grant insert on table "public"."tour_reviews" to "authenticated";

grant references on table "public"."tour_reviews" to "authenticated";

grant select on table "public"."tour_reviews" to "authenticated";

grant trigger on table "public"."tour_reviews" to "authenticated";

grant truncate on table "public"."tour_reviews" to "authenticated";

grant update on table "public"."tour_reviews" to "authenticated";

grant delete on table "public"."tour_reviews" to "service_role";

grant insert on table "public"."tour_reviews" to "service_role";

grant references on table "public"."tour_reviews" to "service_role";

grant select on table "public"."tour_reviews" to "service_role";

grant trigger on table "public"."tour_reviews" to "service_role";

grant truncate on table "public"."tour_reviews" to "service_role";

grant update on table "public"."tour_reviews" to "service_role";


  create policy "Enable delete for authenticated users only"
  on "public"."tour_reviews"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "Enable insert for authenticated users only"
  on "public"."tour_reviews"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Public can read reviews"
  on "public"."tour_reviews"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER trg_create_cart_after_user_insert AFTER INSERT ON public.app_users FOR EACH ROW EXECUTE FUNCTION public.create_cart_for_new_user();

CREATE TRIGGER trigger_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


  create policy "Authenticated users can upload and delete images 1ffg0oo_0"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated users can upload and delete images 1ffg0oo_1"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Public can access 1ffg0oo_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'images'::text));



