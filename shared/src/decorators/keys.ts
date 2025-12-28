export const CLASS_MIDDLEWARES = Symbol("CLASS_MIDDLEWARES");
export const METHOD_MIDDLEWARES = Symbol("METHOD_MIDDLEWARES"); // Map<string, MiddlewareFn<any>[]>
export const METHOD_CACHE_SYMBOLS = Symbol("METHOD_CACHE_SYMBOLS"); // Map<string, symbol>
export const METHOD_WRAPPED = Symbol("METHOD_WRAPPED"); // Set<string>
export const POLICY_MANAGER_KEY = Symbol("POLICY_MANAGER");
