import type { Database } from "@workspace/shared/types/supabase";

export type GetAllCancellationPolicies = Database["public"]["Tables"]["cancellation_policies"]["Row"][];
