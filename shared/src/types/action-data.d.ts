export type ActionResponse =
	| {
			success?: boolean;
			error?: string;
			validationErrors?: Record<string, string[]>;
	  }
	| undefined;

export type ActionReturn =
	| {
			success: boolean;
			error?: undefined;
	  }
	| {
			success: boolean;
			error: any;
	  };
