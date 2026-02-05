import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@workspace/shared/types/supabase";

let supabaseClient: SupabaseClient<Database> | null = null;

function createSupabaseClient() {
	if (!supabaseClient) {
		if (typeof window === "undefined") {
			console.log("server window found!");
			throw new Error("Supabase client requires browser environment and ENV variables");
		}

		const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
		const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

		if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
			throw new Error("Missing Supabase environment variables");
		}

		supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	}

	return supabaseClient;
}

export { createSupabaseClient };
