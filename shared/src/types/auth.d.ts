import type { ApiError } from "@workspace/shared/utils/ApiError";
import type { AdminUser, FullCurrentUser } from "@workspace/shared/types/user";
import { type Session } from "@supabase/supabase-js";

export type GetCurrentUser = {
	user: AdminUser | null;
	error: ApiError | null;
};

export type GetSession = {
	session: Session | null;
	error: ApiError | null;
};

export type Login = {
	error: ApiError | null;
	headers: Headers;
};

export type VerifyOtp = {
	user: User | null;
	session: Session | null;
	error: ApiError | null;
	headers: Headers;
};

export type Logout = {
	error: ApiError | null;
	headers: Headers;
};

export type GetFullCurrentUser = {
	user: FullCurrentUser | null;
	error: ApiError | null;
};
