import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	Row,
	type Table,
	useReactTable,
} from "@tanstack/react-table";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
	Table as TableComponent,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "@workspace/shared/utils/ui";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";
import { motion } from "motion/react";
import { type JSX, memo, useCallback } from "react";
import { Checkbox } from "~/components/ui/checkbox";

interface DataTableProps {
	table: Table<any>;
	onPageChange?: (page: number) => void;
	onPageSizeChange?: (pageSize: number) => void;
	pageSize?: number;
	total?: number;
	customEmptyMessage?: string;
	cellClassName?: string;
	headerClassName?: string;
}

export interface DataTableViewOptionsProps<T> {
	table: Table<T>;
	disabled: boolean;
}

export interface DataTableSkeletonProps {
	noOfSkeletons: number;
	columns: ColumnDef<any>[];
}

export const DataTable = ({
	table,
	onPageChange,
	onPageSizeChange,
	pageSize,
	total,
	customEmptyMessage,
	// cellClassName = "**:data-[slot=table-cell]:last:bg-background",
	cellClassName = "",
	headerClassName = "bg-muted-foreground/5 dark:bg-muted-foreground/20",
}: DataTableProps) => {
	if (!table) {
		return (
			<div>
				<p className="text-center text-muted-foreground">
					Table not initialized. Please check the data source.
				</p>
			</div>
		);
	}

	const PAGE_VALUES = [10, 20, 30, 40, 50];

	return (
		<section>
			<TableComponent>
				<TableHeader className={`sticky top-0 z-10`}>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow
							key={headerGroup.id}
							className="*:whitespace-nowrap sticky top-0 bg-background after:content-[''] after:inset-x-0 after:h-px after:bg-border after:absolute after:bottom-0"
						>
							{headerGroup.headers.map((header, index) => {
								const isFirst = index === 0;
								const isLast = index === headerGroup.headers.length - 1;

								return (
									<TableHead
										key={header.id}
										className={`
											${cn(headerClassName)}
											${isFirst && "rounded-tl-lg"}
											${isLast && "rounded-tr-lg"}`}
									>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody
					className={`**:data-[slot=table-cell]:first:w-8 **:data-[slot=table-cell]:last:sticky **:data-[slot=table-cell]:last:right-0 **:data-[slot=table-cell]:last:z-10 ${cellClassName}`}
				>
					{table.getRowModel().rows?.length > 0 ? (
						table.getRowModel().rows.map((row) => (
							<motion.tr
								key={row.id}
								id={row.id}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.4, ease: "easeOut" }}
								data-state={row.getIsSelected() && "selected"}
								data-slot="table-row"
								className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</motion.tr>
						))
					) : (
						<TableRow>
							<TableCell
								colSpan={table.getAllColumns().length}
								className="h-36 text-center select-none text-muted-foreground"
							>
								<p className="text-sm">{customEmptyMessage ?? "No results found"}</p>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</TableComponent>
			<div className="mt-4">
				<div className="px-4">
					<p>{ShowTotalMessage(total)}</p>
				</div>

				{onPageSizeChange && onPageChange && pageSize ? (
					<div className="mt-4 flex w-full items-center gap-8 justify-between px-4">
						<div className="hidden items-center gap-2 sm:flex">
							<Label htmlFor="rows-per-page" className="text-sm font-medium">
								Rows per page
							</Label>
							<Select
								value={`${pageSize}`}
								onValueChange={(value) => onPageSizeChange(Number(value))}
							>
								<SelectTrigger size="sm" className="w-20" id="rows-per-page">
									<SelectValue placeholder={table.getState().pagination.pageSize} />
								</SelectTrigger>
								<SelectContent side="top" defaultValue={`${pageSize}`}>
									{PAGE_VALUES.map((size) => (
										<SelectItem key={size} value={`${size}`}>
											{size}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex w-fit items-center justify-center text-sm font-medium">
							Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
						</div>
						<div className="ml-auto flex items-center gap-2 sm:ml-0">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 sm:flex"
								onClick={() => onPageChange(0)}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to first page</span>
								<IconChevronsLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => onPageChange(table.getState().pagination.pageIndex - 1)}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to previous page</span>
								<IconChevronLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => onPageChange(table.getState().pagination.pageIndex + 1)}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to next page</span>
								<IconChevronRight />
							</Button>
							<Button
								variant="outline"
								className="hidden size-8 sm:flex"
								size="icon"
								onClick={() => onPageChange(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to last page</span>
								<IconChevronsRight />
							</Button>
						</div>
					</div>
				) : null}
			</div>
		</section>
	);
};

function ShowTotalMessage(total: number | undefined) {
	switch (total) {
		case 0:
		case undefined:
			return "No records found";
		default:
			return `(${total}) record${total === 1 ? "" : "s"} found`;
	}
}

export const DataTableSkeleton = memo(function DataTableSkeleton({
	noOfSkeletons = 8,
	columns,
}: DataTableSkeletonProps) {
	const table = useReactTable({
		data: [],
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<TableComponent>
			<TableHeader className="bg-muted-foreground/5 dark:bg-muted-foreground/20 sticky top-0 z-10">
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id}>
						{headerGroup.headers.map((header) => {
							return (
								<TableHead key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(header.column.columnDef.header, header.getContext())}
								</TableHead>
							);
						})}
					</TableRow>
				))}
			</TableHeader>
			<TableBody className="**:data-[slot=table-cell]:first:w-8">
				{Array.from({ length: noOfSkeletons }, (_, i) => i + 1).map((i) => (
					<TableRow key={i}>
						{Array.from({ length: columns.length }, (_, i) => i + 1).map((index) => {
							return (
								<TableCell key={index + index}>
									<Skeleton className="h-7.5 w-full bg-muted-foreground/5 dark:bg-muted-foreground/20" />
								</TableCell>
							);
						})}
					</TableRow>
				))}
			</TableBody>
		</TableComponent>
	);
});

export function TableColumnsToggle({ table }: { table: Table<any> }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-8 flex cursor-pointer select-none dark:hover:bg-muted"
				>
					<Settings2 />
					<span className="hidden md:inline">Columns</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-37.5">
				<DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{table
					.getAllColumns()
					.filter((column: any) => typeof column.accessorFn !== "undefined" && column.getCanHide())
					.map((column: any) => {
						return (
							<DropdownMenuCheckboxItem
								key={column.id}
								className="cursor-pointer"
								checked={column.getIsVisible()}
								onCheckedChange={(value) => column.toggleVisibility(!!value)}
							>
								{column.id}
							</DropdownMenuCheckboxItem>
						);
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

interface TableRowSelectorProps<TableValues extends Record<string, any>> {
	name: keyof TableValues;
}

export function TableRowSelector<TableValues extends Record<string, any>>({
	name,
}: TableRowSelectorProps<TableValues>) {
	const header = useCallback(
		({ table }: { table: Table<TableValues[typeof name]> }): JSX.Element | null => {
			const rows = table.getRowCount();
			return rows > 0 ? (
				<div className="flex items-center justify-center mr-2 ml-1">
					<Checkbox
						checked={
							table.getIsAllPageRowsSelected() ||
							(table.getIsSomePageRowsSelected() && "indeterminate")
						}
						onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
						aria-label="Select all"
					/>
				</div>
			) : null;
		},
		[],
	);

	const cell = useCallback(({ row }: { row: Row<TableValues[typeof name]> }): JSX.Element => {
		return (
			<div className="flex items-center justify-center mr-2 ml-1">
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
				/>
			</div>
		);
	}, []);

	return { header, cell };
}
