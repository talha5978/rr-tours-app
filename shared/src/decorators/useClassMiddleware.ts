import { CLASS_MIDDLEWARES, METHOD_WRAPPED } from "@workspace/shared/decorators/keys";
import {
	composeMiddlewares,
	ensureProtoMaps,
	getAllMethodNames,
	getOrCreateCacheSymbol,
	resolveMiddlewaresForInstance,
} from "@workspace/shared/decorators/utils";
import type { ServiceBase } from "@workspace/shared/services/service.base";
import type { MiddlewareFn } from "@workspace/shared/types/middleware";

/** Decorator to apply middleware to whole class means all of its methods automatically. */
export function UseClassMiddleware<T extends ServiceBase = ServiceBase>(
	...classMiddlewares: MiddlewareFn<T>[]
) {
	return function <C extends new (...args: any[]) => any>(constructor: C) {
		const ctorAny = constructor as any;

		// store class-level middlewares on constructor (non-generic)
		Object.defineProperty(ctorAny, CLASS_MIDDLEWARES, {
			value: classMiddlewares as unknown as MiddlewareFn<any>[],
			writable: false,
			configurable: true,
			enumerable: false,
		});

		const proto = constructor.prototype;
		ensureProtoMaps(proto);

		// choose how to collect methods:
		// use own property names (current default) — if you want inherited methods, replace with getAllMethodNames
		const methodNames = getAllMethodNames(proto);

		for (const methodName of methodNames) {
			const wrappedSet: Set<string> = proto[METHOD_WRAPPED];
			if (wrappedSet.has(methodName)) continue;

			const originalMethod = proto[methodName];
			const cacheSym = getOrCreateCacheSymbol(proto, methodName);

			const wrapped = function (this: InstanceType<C>, ...args: unknown[]) {
				const instance = this as any;

				// resolve and cast to concrete InstanceType<C>
				const all = resolveMiddlewaresForInstance<InstanceType<C>>(ctorAny, proto, methodName);

				if (!all.length) return originalMethod.apply(instance, args);

				if (!(cacheSym in instance)) {
					const originalCall = (callArgs: unknown[]) =>
						Promise.resolve(originalMethod.apply(instance, callArgs));
					const composed = composeMiddlewares(
						all,
						originalCall,
						instance as InstanceType<C>,
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

			Object.defineProperty(proto, methodName, {
				value: wrapped,
				configurable: true,
				writable: true,
				enumerable: false,
			});
			wrappedSet.add(methodName);
		}
	};
}
