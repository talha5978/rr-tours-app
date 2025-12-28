import { ServiceBase } from "@workspace/shared/services/service.base";

export type MiddlewareContext<
	TService extends ServiceBase = ServiceBase,
	THeaders = Headers,
	TRequest = Request,
> = {
	service: TService;
	methodName: string;
	args: unknown[];
	supabase?: TService["supabase"];
};

export type MiddlewareFn<
	TService extends ServiceBase = ServiceBase,
	THeaders = Headers,
	TRequest = Request,
> = (ctx: MiddlewareContext<TService, THeaders, TRequest>, next: () => Promise<unknown>) => Promise<unknown>;
