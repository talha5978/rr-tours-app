import { ServiceBase } from "@workspace/shared/services/service.base";
import type { MiddlewareFn } from "@workspace/shared/types/middleware";
import {
	composeMiddlewares,
	ensureProtoMaps,
	getOrCreateCacheSymbol,
	resolveMiddlewaresForInstance,
} from "@workspace/shared/decorators/utils";
import { METHOD_MIDDLEWARES, METHOD_WRAPPED } from "@workspace/shared/decorators/keys";

/** Decorator to apply middleware to a service function. */
export function UseMiddleware<T extends ServiceBase = ServiceBase>(...methodMiddlewares: MiddlewareFn<T>[]) {
	return function <T extends (...args: any[]) => any>(
		target: any,
		propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<T>,
	) {
		if (typeof propertyKey === "symbol") propertyKey = propertyKey.toString();
		const methodName = String(propertyKey);
		const originalMethod = descriptor.value!;
		if (typeof originalMethod !== "function") return descriptor;

		ensureProtoMaps(target);

		const map: Map<string, MiddlewareFn<any>[]> = target[METHOD_MIDDLEWARES];
		const existing = map.get(methodName) ?? [];
		map.set(methodName, existing.concat(methodMiddlewares as unknown as MiddlewareFn<any>[]));

		const cacheSym = getOrCreateCacheSymbol(target, methodName);

		const wrapper = function (
			this: ServiceBase,
			...args: Parameters<T>
		): ReturnType<T> | Promise<ReturnType<T>> {
			const instance = this as any;
			const ctorAny = instance?.constructor as any;

			// Resolve middlewares and cast to concrete type using InstanceType<typeof ctor>
			const all = resolveMiddlewaresForInstance<any>(ctorAny, target, methodName);

			if (!all.length) return originalMethod.apply(instance, args);

			if (!(cacheSym in instance)) {
				const originalCall = (callArgs: unknown[]) =>
					Promise.resolve(originalMethod.apply(instance, callArgs));
				const composed = composeMiddlewares(
					all,
					originalCall,
					instance as any,
					methodName,
					(instance as any)?.supabase,
				);
				Object.defineProperty(instance, cacheSym, {
					value: composed,
					configurable: false,
					enumerable: false,
					writable: false,
				});
			}

			return (instance as any)[cacheSym](args);
		};

		descriptor.value = wrapper as unknown as T;
		target[METHOD_WRAPPED].add(methodName);
		return descriptor;
	};
}
