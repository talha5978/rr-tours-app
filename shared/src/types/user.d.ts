export enum UserRole {
	ADMIN = "admin",
	CONSUMER = "consumer",
}

export type AdminUser = {
	id: string;
	email: string;
	is_email_verified: boolean;
	created_at: string;
	first_name: string | null;
	last_name: string | null;
	phone_number: string | null;
	role: {
		role_id: number;
		role_name: string;
	};
};

export type FullCurrentUser = {
	id: string;
	email: string;
	is_email_verified: boolean;
	created_at: string;
	first_name: string | null;
	last_name: string | null;
	avatar_url?: string | null;
	phone_number: string | null;
	country: string | null;
	role: {
		role_id: number;
		role_name: string;
	};
};
