import type {
	GetCurrentUser,
	GetFullCurrentUser,
	GetSession,
	Login,
	Logout,
	VerifyOtp,
} from "@workspace/shared/types/auth.d";
import type { AdminUser, FullCurrentUser } from "@workspace/shared/types/user.d";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { Service } from "@workspace/shared/services/service.base";
import { Provider, type Session, type User, type UserResponse } from "@supabase/auth-js";
import { ApiError } from "@workspace/shared/utils/ApiError";

@UseClassMiddleware(loggerMiddleware)
export class AuthService extends Service {
	async getCurrentUser(isAdmin = true): Promise<GetCurrentUser> {
		console.log("🌸 Running the GET current user service");
		try {
			const {
				data: { user: authUser },
				error: authUserErr,
			} = await this.supabase.auth.getUser();
			// console.log("Auth user: ", authUser);

			let error: null | ApiError = null;
			if (authUserErr || authUser == null) {
				error = new ApiError(authUserErr?.message || "User not found", 401, []);
				return { user: null, error };
			}

			// console.log("Reached here 😀😀😀", authUser.id);

			let query = this.supabase
				.from(this.USERS_TABLE)
				.select(
					`
					user_id,
					first_name,
					last_name,
					phone_number,
					role,
					${this.USER_ROLES_TABLE}(id, role_name)
				`,
				)
				.eq("user_id", authUser.id)
				.eq("status", true);
			// .single();

			if (isAdmin) {
				const { data: adminRoleId, error: adminRoleIdError } = await this.supabase
					.from(this.USER_ROLES_TABLE)
					.select("id")
					.eq("role_name", "admin")
					.limit(1)
					.single();

				if (adminRoleIdError || adminRoleId == null) {
					error = new ApiError(adminRoleIdError?.message || "Admin role not found", 401, []);
					return { user: null, error };
				}

				query = query.eq("role", adminRoleId.id);
			}

			const { data, error: userDetailsErr } = await query;
			// console.log("Reached at next level 😀😀😀", userDetails ?? "NOT FOUND 🌋");
			const userDetails = data != null ? data[0] : null;

			if (userDetailsErr || userDetails == null) {
				error = new ApiError(userDetailsErr?.message || "User not found", 401, []);
				return { user: null, error };
			}

			const appUser: AdminUser = {
				id: authUser.id ?? userDetails.user_id,
				email: authUser.email ?? "",
				is_email_verified: authUser.user_metadata.email_verified ?? true,
				created_at: authUser.created_at,
				first_name: userDetails.first_name ?? null,
				last_name: userDetails.last_name ?? null,
				phone_number: userDetails.phone_number ?? null,
				role: {
					role_id: userDetails.user_roles.id,
					role_name: userDetails.user_roles.role_name,
				},
			};

			return { user: appUser, error };
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { user: null, error: err };
			}
			return {
				user: null,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	async getSession(): Promise<GetSession> {
		try {
			const {
				data: { session },
				error: sessionErr,
			} = await this.supabase.auth.getSession();
			// console.log("Auth user: ", authUser);

			let error: null | ApiError = null;
			if (sessionErr || session == null) {
				error = new ApiError(sessionErr?.message || "Session not found", 401, []);
				return { session: null, error };
			}

			return { session, error };
		} catch (err: any) {
			return {
				session: null,
				error: err instanceof ApiError ? err : new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	async getCode({ email }: { email: string }): Promise<Login> {
		try {
			const { error: fetchError } = await this.supabase.auth.signInWithOtp({
				email,
				options: { shouldCreateUser: false },
			});

			// data and session if destructrud from here will be null because it is OTP login

			let error: null | ApiError = null;
			if (fetchError) {
				error = new ApiError(fetchError.message, 500, []);
			}

			return { error, headers: this.headers };
		} catch (err: any) {
			return {
				error: err instanceof ApiError ? err : new ApiError("Unknown error", 500, [err]),
				headers: this.headers,
			};
		}
	}

	async verifyOtp({ email, token }: { email: string; token: string }): Promise<VerifyOtp> {
		try {
			const {
				error: fetchError,
				data: { user, session },
			} = await this.supabase.auth.verifyOtp({
				email,
				token,
				type: "email",
			});

			// console.log(user, session, fetchError);

			// If successful, the user is now logged in, and you receive a valid session that looks like

			let error: null | ApiError = null;
			if (fetchError) {
				error = new ApiError(fetchError.message, Number(fetchError.code) || 500, []);
			}
			// console.log(this.headers);

			return { error, user, session, headers: this.headers };
		} catch (err: any) {
			return {
				user: null,
				session: null,
				error: err instanceof ApiError ? err : new ApiError("Unknown error", 500, [err]),
				headers: this.headers,
			};
		}
	}

	async logout(): Promise<Logout> {
		try {
			// Signout the user for this session only
			const { error: logoutErrr } = await this.supabase.auth.signOut({ scope: "local" });

			let error: null | ApiError = null;
			if (logoutErrr) {
				error = new ApiError(logoutErrr.message, 500, []);
			}

			return { error, headers: this.headers };
		} catch (err: any) {
			return {
				error: err instanceof ApiError ? err : new ApiError("Unknown error", 500, [err]),
				headers: this.headers,
			};
		}
	}

	async exchangeCodeForSession({ code }: { code: string }): Promise<
		Login & {
			data: {
				user: User | null;
				session: Session | null;
			} | null;
		}
	> {
		try {
			const { error: fetchError, data } = await this.supabase.auth.exchangeCodeForSession(code);

			let error: null | ApiError = null;
			if (fetchError) {
				error = new ApiError(fetchError.message, 500, []);
			}

			return { error, headers: this.headers, data };
		} catch (err: any) {
			return {
				error: err instanceof ApiError ? err : new ApiError("Unknown error", 500, [err]),
				headers: this.headers,
				data: null,
			};
		}
	}

	async getFullCurrentUser(): Promise<GetFullCurrentUser> {
		console.log("FETCHING CURRENT USER -------->");
		try {
			const {
				data: { user: authUser },
				error: authUserErr,
			} = await this.supabase.auth.getUser();
			// console.log("Auth user: ", authUser);

			let error: null | ApiError = null;
			if (authUserErr || authUser == null) {
				error = new ApiError(authUserErr?.message || "User not found", 401, []);
				return { user: null, error };
			}

			const { data: userDetails, error: userDetailsErr } = await this.supabase
				.from(this.USERS_TABLE)
				.select(
					`
					user_id,
					first_name,
					last_name,
					phone_number,
					role,
					created_at,
					${this.USER_ROLES_TABLE}(id, role_name)
				`,
				)
				.eq("user_id", authUser.id)
				.eq("status", true)
				.single();

			if (userDetailsErr || userDetails == null) {
				error = new ApiError(userDetailsErr?.message || "User not found", 401, []);
				return { user: null, error };
			}

			const frontPanelUser: FullCurrentUser = {
				id: authUser.id ?? userDetails.user_id,
				email: authUser.email ?? "",
				is_email_verified: authUser.user_metadata.email_verified ?? true,
				first_name: userDetails.first_name ?? null,
				last_name: userDetails.last_name ?? null,
				phone_number: userDetails.phone_number ?? null,
				role: {
					role_id: userDetails.user_roles.id,
					role_name: userDetails.user_roles.role_name,
				},
				created_at: userDetails.created_at ?? "N/A",
			};

			return { user: frontPanelUser, error };
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { user: null, error: err };
			}
			return {
				user: null,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	async loginWithPassword({ email, password }: { email: string; password: string }): Promise<Login> {
		try {
			const { error: fetchError } = await this.supabase.auth.signInWithPassword({
				email,
				password: password,
			});

			let error: null | ApiError = null;
			if (fetchError) {
				error = new ApiError(fetchError.message, 500, []);
			}

			return { error, headers: this.headers };
		} catch (err: any) {
			return {
				error: err instanceof ApiError ? err : new ApiError("Unknown error", 500, [err]),
				headers: this.headers,
			};
		}
	}

	async loginWithGoogle({
		redirectToOrigin,
	}: {
		redirectToOrigin: string;
	}): Promise<Login & { url: string | null }> {
		try {
			const PROVIDER: Provider = "google";
			const redirectTo =
				process.env.NODE_ENV === "production"
					? process.env.VITE_MAIN_APP_URL + "/auth/callback"
					: redirectToOrigin + "/auth/callback";

			const { error: fetchError, data } = await this.supabase.auth.signInWithOAuth({
				provider: PROVIDER,
				options: {
					redirectTo: redirectTo,
					queryParams: {
						access_type: "offline",
						prompt: "consent",
					},
				},
			});

			let error: null | ApiError = null;
			if (fetchError) {
				console.error(fetchError);
				error = new ApiError(fetchError.message, Number(fetchError.code) || 500, []);
			}

			return { error, headers: this.headers, url: data.url };
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { error: err, headers: this.headers, url: null };
			}

			return {
				error: new ApiError("Unknown error", 500, [err]),
				headers: this.headers,
				url: null,
			};
		}
	}

	async getAuthSchemaUser(id: string): Promise<UserResponse> {
		try {
			const resp = await this.supabase.auth.admin.getUserById(String(id)).then((res) => {
				return res;
			});

			return resp;
		} catch (error) {
			throw error;
		}
	}
}
