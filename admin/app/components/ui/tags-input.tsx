import * as TagsInputPrimitive from "@diceui/tags-input";
import { cn } from "@workspace/shared/utils/ui";
import { RefreshCcw, X } from "lucide-react";
import * as React from "react";

const TagsInput = React.forwardRef<
	React.ComponentRef<typeof TagsInputPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof TagsInputPrimitive.Root>
>(({ className, ...props }, ref) => (
	<TagsInputPrimitive.Root
		data-slot="tags-input"
		ref={ref}
		className={cn("flex min-w-0 flex-col gap-2 ", className)}
		{...props}
	/>
));
TagsInput.displayName = TagsInputPrimitive.Root.displayName;

const TagsInputLabel = React.forwardRef<
	React.ComponentRef<typeof TagsInputPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof TagsInputPrimitive.Label>
>(({ className, ...props }, ref) => (
	<TagsInputPrimitive.Label
		data-slot="tags-input-label"
		ref={ref}
		className={cn(
			"font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
			className,
		)}
		{...props}
	/>
));
TagsInputLabel.displayName = TagsInputPrimitive.Label.displayName;

const TagsInputList = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div"> & { "aria-invalid"?: boolean }
>(({ className, "aria-invalid": ariaInvalid, ...props }, ref) => (
	<div
		data-slot="tags-input-list"
		ref={ref}
		className={cn(
			"flex min-h-9 w-full flex-wrap items-center gap-2 rounded-md border border-input selection:bg-primary selection:text-primary-foreground px-3 py-3 shadow-xs transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:text-foreground dark:placeholder:text-muted-foreground md:text-sm",
			"focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
			ariaInvalid && "border-destructive ring-destructive/20 dark:ring-destructive/40",
			className,
		)}
		aria-invalid={ariaInvalid}
		{...props}
	/>
));
TagsInputList.displayName = "TagsInputList";

const TagsInputInput = React.forwardRef<
	React.ComponentRef<typeof TagsInputPrimitive.Input>,
	React.ComponentPropsWithoutRef<typeof TagsInputPrimitive.Input>
>(({ className, ...props }, ref) => (
	<TagsInputPrimitive.Input
		data-slot="tags-input-input"
		ref={ref}
		className={cn(
			"flex-1 bg-transparent outline-hidden placeholder:text-muted-foreground text-sm selection:bg-primary selection:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50",
			className,
		)}
		{...props}
	/>
));
TagsInputInput.displayName = TagsInputPrimitive.Input.displayName;

const TagsInputItem = React.forwardRef<
	React.ComponentRef<typeof TagsInputPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof TagsInputPrimitive.Item>
>(({ className, children, ...props }, ref) => (
	<TagsInputPrimitive.Item
		data-slot="tags-input-item"
		ref={ref}
		className={cn(
			"inline-flex max-w-[calc(100%-50px)] items-center gap-1.5 rounded border bg-transparent px-2.5 text-sm focus:outline-hidden data-disabled:cursor-not-allowed data-editable:select-none data-editing:bg-transparent data-disabled:opacity-50 data-editing:ring-1 data-editing:ring-ring [&:not([data-editing])]:pr-1.5 [&[data-highlighted]:not([data-editing])]:bg-accent [&[data-highlighted]:not([data-editing])]:text-accent-foreground",
			className,
		)}
		{...props}
	>
		<TagsInputPrimitive.ItemText className="truncate">{children}</TagsInputPrimitive.ItemText>
		<TagsInputPrimitive.ItemDelete className="h-4 w-4 shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
			<X className="h-3.5 w-3.5 cursor-pointer" />
		</TagsInputPrimitive.ItemDelete>
	</TagsInputPrimitive.Item>
));
TagsInputItem.displayName = TagsInputPrimitive.Item.displayName;

const TagsInputClear = React.forwardRef<
	React.ComponentRef<typeof TagsInputPrimitive.Clear>,
	React.ComponentPropsWithoutRef<typeof TagsInputPrimitive.Clear>
>(({ className, ...props }, ref) => (
	<TagsInputPrimitive.Clear data-slot="tags-input-clear" ref={ref} {...props} />
));
TagsInputClear.displayName = TagsInputPrimitive.Clear.displayName;

const CustomTagsInputClear = React.forwardRef<
	React.ComponentRef<typeof TagsInputPrimitive.Clear>,
	React.ComponentPropsWithoutRef<typeof TagsInputPrimitive.Clear>
>(({ className, ...props }, ref) => (
	<TagsInputPrimitive.Clear
		data-slot="tags-input-clear"
		ref={ref}
		className={cn("sm:w-fit w-full CustomTagsInputClear", className)}
		{...props}
	>
		<div className="wrapper inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointe border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 sm:size-9 h-9 w-full cursor-pointer">
			<RefreshCcw className="h-4 w-4 refresh-icon" />
			<p className="sm:hidden inline">Reset</p>
		</div>
	</TagsInputPrimitive.Clear>
));

CustomTagsInputClear.displayName = TagsInputPrimitive.Clear.displayName;

export {
	TagsInput,
	TagsInputLabel,
	TagsInputList,
	TagsInputInput,
	TagsInputItem,
	TagsInputClear,
	CustomTagsInputClear,
};
