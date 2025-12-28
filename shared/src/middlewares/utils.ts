import type { ServiceBase } from "@workspace/shared/services/service.base";
import type { MiddlewareContext, MiddlewareFn } from "@workspace/shared/types/middleware";
import { ApiError } from "@workspace/shared/utils/ApiError";

/**
 * Cast a ServiceBase-typed middleware to MiddlewareFn<T> for use at decorator site.
 * This is a compile-time cast only; runtime behavior is unchanged.
 *
 * Usage: @UseClassMiddleware(asServiceMiddleware<MyService>(verifyUser))
 */
export function asServiceMiddleware<T extends ServiceBase = ServiceBase>(
	mw: MiddlewareFn<ServiceBase>,
): MiddlewareFn<T> {
	return mw as unknown as MiddlewareFn<T>;
}

/** Small uitily to initilize a middleware specifically for service function(s)*/
export function createServiceMiddleware<T extends ServiceBase = ServiceBase>(
	fn: MiddlewareFn<T>,
): MiddlewareFn<T> {
	return async (ctx, next) => {
		if (!ctx.service) throw new ApiError("Middleware used outside service context", 500, []);
		return fn(ctx as MiddlewareContext<T> & { service: T }, next);
	};
}
