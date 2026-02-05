import { useEffect, useState } from "react";
import { createSupabaseClient } from "@workspace/shared/utils/supabase/supabase.client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@workspace/shared/types/supabase";

export function useSupabaseClient() {
	const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);

	useEffect(() => {
		const client = createSupabaseClient();
		setSupabase(client);
	}, []);

	return supabase;
}
