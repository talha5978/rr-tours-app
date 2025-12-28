import {
	CLASS_MIDDLEWARES,
	METHOD_CACHE_SYMBOLS,
	METHOD_MIDDLEWARES,
	METHOD_WRAPPED,
} from "@workspace/shared/decorators/keys";
import { ServiceBase } from "@workspace/shared/services/service.base";
import type { MiddlewareContext, MiddlewareFn } from "@workspace/shared/types/middleware";

export function composeMiddlewares<TService extends ServiceBase = ServiceBase>(
	middlewares: MiddlewareFn<TService>[],
	originalCall: (callArgs: unknown[]) => Promise<unknown>,
	instance: TService,
	methodName: string,
	supabase?: unknown,
): (callArgs: unknown[]) => Promise<unknown> {
	return middlewares.reduceRight(
		(nextFn, mw) => (callArgs: unknown[]) =>
			mw(
				{ service: instance, methodName, args: callArgs, supabase } as MiddlewareContext<TService>,
				() => nextFn(callArgs),
			),
		originalCall,
	);
}

/**
 * Ensure prototype maps/sets exist and are owned by the prototype.
 * Use this everywhere to avoid accidental sharing or mismatch.
 */
export function ensureProtoMaps(proto: any) {
	if (!Object.prototype.hasOwnProperty.call(proto, METHOD_MIDDLEWARES)) {
		Object.defineProperty(proto, METHOD_MIDDLEWARES, {
			value: new Map<string, MiddlewareFn<any>[]>(),
			configurable: true,
			enumerable: false,
			writable: true,
		});
	}
	if (!Object.prototype.hasOwnProperty.call(proto, METHOD_CACHE_SYMBOLS)) {
		Object.defineProperty(proto, METHOD_CACHE_SYMBOLS, {
			value: new Map<string, symbol>(),
			configurable: true,
			enumerable: false,
			writable: true,
		});
	}
	if (!Object.prototype.hasOwnProperty.call(proto, METHOD_WRAPPED)) {
		Object.defineProperty(proto, METHOD_WRAPPED, {
			value: new Set<string>(),
			configurable: true,
			enumerable: false,
			writable: true,
		});
	}
}

/** Get or create the cache symbol for a method on the prototype. */
export function getOrCreateCacheSymbol(proto: any, methodName: string): symbol {
	ensureProtoMaps(proto);
	const map: Map<string, symbol> = proto[METHOD_CACHE_SYMBOLS];
	if (!map.has(methodName)) map.set(methodName, Symbol(`__mw_cache_${methodName}`));
	return map.get(methodName)!;
}

/** Resolve class + method middlewares for a concrete instance type (casts internally). */
export function resolveMiddlewaresForInstance<T extends ServiceBase = ServiceBase>(
	ctorAny: any,
	proto: any,
	methodName: string,
): MiddlewareFn<T>[] {
	const classRaw: MiddlewareFn<any>[] = Array.isArray(ctorAny?.[CLASS_MIDDLEWARES])
		? ctorAny[CLASS_MIDDLEWARES]
		: [];
	const methodRaw: MiddlewareFn<any>[] = proto[METHOD_MIDDLEWARES]?.get(methodName) ?? [];
	return (classRaw as unknown as MiddlewareFn<T>[]).concat(methodRaw as unknown as MiddlewareFn<T>[]);
}

export function getAllMethodNames(proto: any) {
	const names = new Set<string>();
	while (proto && proto !== Object.prototype) {
		for (const n of Object.getOwnPropertyNames(proto)) {
			if (n === "constructor") continue;
			if (typeof proto[n] === "function") names.add(n);
		}
		proto = Object.getPrototypeOf(proto);
	}
	return Array.from(names);
}
