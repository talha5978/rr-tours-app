import { NavigateFunction, useNavigate, useSearchParams } from "react-router";

interface PaginationControlsReturnType {
	onPageChange: (newPageIndex: number) => void;
	onPageSizeChange: (newPageSize: number) => void;
}

interface PaginationControlsProps {
	defaultPage?: number;
}

class GetPaginationControlsController {
	private readonly navigate: NavigateFunction;
	private readonly searchParams: URLSearchParams;
	private readonly defaultPage: number;

	/**
	 * @description Returns the control functions for page and page size changes
	 */

	constructor({ defaultPage = 1 }: PaginationControlsProps) {
		const navigate = useNavigate();
		this.navigate = navigate;
		const [searchParams] = useSearchParams();
		this.searchParams = searchParams;
		this.defaultPage = defaultPage;
	}

	onPageChange = (newPageIndex: number) => {
		this.searchParams.set("page", (newPageIndex + 1).toString());
		this.navigate({ search: this.searchParams.toString() });
	};

	onPageSizeChange = (newPageSize: number) => {
		this.searchParams.set("size", newPageSize.toString());
		this.searchParams.set("page", String(this.defaultPage));
		this.navigate({ search: this.searchParams.toString() });
	};
}

export function GetPaginationControls({
	defaultPage = 1,
}: PaginationControlsProps): PaginationControlsReturnType {
	const GetPaginationControls = new GetPaginationControlsController({
		defaultPage,
	});

	return GetPaginationControls;
}
