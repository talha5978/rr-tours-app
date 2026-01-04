type Params = {
	search: string;
	pathname: string;
	defaultPage?: string;
	defaultSize?: string;
};

export function getToursResetFiltersUrl({
	search,
	pathname,
	defaultPage = "1",
	defaultSize = "10",
}: Params): string {
	const searchParams = new URLSearchParams(search);
	const newParams = new URLSearchParams();

	const page = searchParams.get("page");
	const size = searchParams.get("size");

	if (page && page !== defaultPage) newParams.set("page", page);
	if (size && size !== defaultSize) newParams.set("size", size);

	const newSearch = newParams.toString();
	return newSearch ? `${pathname}?${newSearch}` : pathname;
}
