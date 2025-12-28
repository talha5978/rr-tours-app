interface PaginationQueryPayloadParams {
	request: Request;
	defaultPageNo?: number;
	defaultPageSize?: number;
}
/**
 * @param request : request getting in the loader
 * @param defaultPageNo : default page no. for current entitiy usually (1)
 * @param defaultPageSize : default page size for current entitiy usually (10)
 *
 * @description : get the query payload for pagination and the search query in the loader of an entity page
 *
 * @returns { q, pageIndex, pageSize }
 */
export function getPaginationQueryPayload({
	request,
	defaultPageNo = 1,
	defaultPageSize = 10,
}: PaginationQueryPayloadParams) {
	const url = new URL(request.url);
	const q = url.searchParams.get("q")?.trim() ?? "";
	const pageParam = Number(url.searchParams.get("page") ?? String(defaultPageNo));
	const sizeParam = Number(url.searchParams.get("size") ?? String(defaultPageSize));

	const pageIndex = Math.max(0, pageParam - 1);
	const pageSize = Math.max(1, sizeParam);

	return {
		q,
		pageIndex,
		pageSize,
	};
}
