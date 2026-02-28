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
import { GenerateLinkParams, type Session, type User, type UserResponse } from "@supabase/auth-js";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { SignupFormData } from "@workspace/shared/schemas/signup.schema";
import { ProfileUpdateForm } from "@workspace/shared/schemas/profile-update.schema";

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

			let frontPanelUser: FullCurrentUser = {
				id: authUser.id ?? userDetails.user_id,
				email: authUser.email ?? "",
				is_email_verified: authUser.user_metadata.email_verified ?? true,
				first_name: userDetails.first_name ?? null,
				last_name: userDetails.last_name ?? null,
				phone_number: userDetails.phone_number ?? null,
				avatar_url: null,
				role: {
					role_id: userDetails.user_roles.id,
					role_name: userDetails.user_roles.role_name,
				},
				created_at: userDetails.created_at ?? "N/A",
				country: null,
			};

			if (userDetails != null) {
				const { data: authUserResp } = await this.getAuthSchemaUser(frontPanelUser.id);
				frontPanelUser.avatar_url = authUserResp.user?.user_metadata?.avatar_url ?? null;
			}

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

	async getUserById(user_id: string): Promise<{
		error: ApiError | null;
		user: {
			user_id: string;
			role: number;
			created_at: string | null;
		} | null;
	}> {
		try {
			let error: null | ApiError = null;

			const { data: userDetails, error: userDetailsErr } = await this.supabase
				.from(this.USERS_TABLE)
				.select(
					`
					user_id,
					role,
					created_at
				`,
				)
				.eq("user_id", user_id)
				.eq("status", true)
				.limit(1)
				.maybeSingle();

			if (userDetailsErr || userDetails == null) {
				error = new ApiError(userDetailsErr?.message || "User not found", 401, []);
				return { user: null, error };
			}

			return {
				user: userDetails
					? {
							user_id: userDetails.user_id,
							role: userDetails.role,
							created_at: userDetails.created_at,
						}
					: null,
				error,
			};
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

	async loginWithPassword({ email, password }: { email: string; password: string }): Promise<{
		error: ApiError | null;
		session: Session | null;
		headers: Headers;
	}> {
		try {
			const { data, error: fetchError } = await this.supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (fetchError) {
				return {
					error: new ApiError(fetchError.message, 401, []),
					session: null,
					headers: this.headers,
				};
			}

			if (!data.session) {
				return {
					error: new ApiError("No session returned after login", 500, []),
					session: null,
					headers: this.headers,
				};
			}

			return {
				error: null,
				session: data.session,
				headers: this.headers,
			};
		} catch (err: any) {
			return {
				error: err instanceof ApiError ? err : new ApiError("Unknown error", 500, [err]),
				session: null,
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
			const redirectTo = redirectToOrigin;

			const { error: fetchError, data } = await this.supabase.auth.signInWithOAuth({
				provider: "google",
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

	async sendResetPasswordRequest(email: string, redirectTo: string) {
		const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
			redirectTo: redirectTo,
		});

		return {
			data,
			error: error ? new ApiError(error.message, Number(error.code ?? 500), [error.stack]) : null,
		};
	}

	async generateLink(params: GenerateLinkParams) {
		const { data, error } = await this.supabase.auth.admin.generateLink(params);

		return {
			data,
			error: error ? new ApiError(error.message, Number(error.code ?? 500), [error.stack]) : null,
		};
	}

	async insertConsumerUser(data: {
		user_id: string;
		firstName: string;
		lastName: string;
		phone: string | null;
	}): Promise<
		| {
				success: boolean;
				error: string | null;
		  }
		| undefined
	> {
		const { data: roleData, error: roleError } = await this.supabase
			.from(this.USER_ROLES_TABLE)
			.select("id")
			.eq("role_name", "consumer")
			.limit(1)
			.maybeSingle();

		if (!roleData || roleError) {
			console.error("Role fetch failed:", roleError);
			return {
				success: false,
				error: "Failed to create account. Please contact support.",
			};
		}

		const {
			error: profileError,
			count,
			data: insertedCustomer,
			status,
			statusText,
		} = await this.supabase.from(this.USERS_TABLE).insert({
			user_id: data.user_id,
			first_name: data.firstName,
			last_name: data.lastName,
			phone_number: data.phone || null,
			role: roleData.id,
			status: true,
		});

		console.log("[PROD PROFILE DEBUG] Insert raw response:", {
			insertedData: insertedCustomer,
			profileError: profileError
				? {
						code: profileError.code,
						message: profileError.message,
						details: profileError.details,
						hint: profileError.hint,
					}
				: null,
			status,
			statusText,
			count,
		});

		if (profileError) {
			console.error("Profile insert failed:", profileError);
			this.deleteAuthUser(data.user_id);
			return {
				success: false,
				error: "Account creation failed.",
			};
		}
	}

	async deleteAuthUser(user_id: string) {
		await this.supabase.auth.admin.deleteUser(user_id);
	}

	async signUpWithPasswordAndProfile(data: Omit<SignupFormData, "confirmPassword">): Promise<{
		success: boolean;
		user?: any;
		session?: any;
		error?: string;
	}> {
		try {
			const { data: authData, error: authError } = await this.supabase.auth.signUp({
				email: data.email,
				password: data.password,
				options: {
					data: {
						first_name: data.firstName,
						last_name: data.lastName,
						...(data.phone ? { phone_number: data.phone } : {}),
					},
				},
			});

			if (authError) {
				return {
					success: false,
					error: authError.message || "Failed to create account",
				};
			}

			if (!authData.user) {
				return {
					success: false,
					error: "No user returned after signup",
				};
			}

			await this.insertConsumerUser({
				user_id: authData.user.id,
				firstName: data.firstName,
				lastName: data.lastName,
				phone: data.phone ?? null,
			});

			// Success
			return {
				success: true,
				user: authData.user,
				session: authData.session,
			};
		} catch (err: any) {
			console.error("Signup error:", err);
			return {
				success: false,
				error: err.message || "An unexpected error occurred during signup",
			};
		}
	}

	async updateUserProfile(data: ProfileUpdateForm & { user_id: string }) {
		const { data: profileData, error: profileError } = await this.supabase
			.from(this.USERS_TABLE)
			.update({
				first_name: data.first_name,
				last_name: data.last_name,
				phone_number: data.phone_number,
				country: data.country,
			})
			.eq("user_id", data.user_id);

		return {
			data: profileData,
			error: profileError
				? new ApiError(profileError.message, Number(profileError.code ?? 500), [profileError.stack])
				: null,
		};
	}
}
