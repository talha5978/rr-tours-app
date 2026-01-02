import { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "~/components/ui/badge";
import { Check, X } from "lucide-react";
import { IconPointFilled } from "@tabler/icons-react";
import { cn } from "@workspace/shared/utils/ui";

const Default_Icon = "dot";

const statusBadgeVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-xs font-medium transition-all",
	{
		variants: {
			variant: {
				default:
					"bg-muted-foreground/10 dark:bg-muted-foreground/20 text-muted-foreground shadow-none",
				success: "bg-primary dark:bg-primary/50 text-white shadow-none",
				destructive: "bg-destructive dark:bg-destructive/85 text-white shadow-none",
				warning: "bg-warning/70 dark:bg-warning/60 text-white shadow-none",
			},
			// empty class names for future modification
			icon: {
				dot: "",
				tick: "",
				cross: "",
			},
		},
		defaultVariants: {
			variant: "default",
			icon: Default_Icon,
		},
	},
);

interface StatusBadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof statusBadgeVariants> {
	variant: "default" | "success" | "destructive" | "warning";
	icon?: "dot" | "tick" | "cross";
}

const StatusBadge = ({ className, variant, icon = Default_Icon, children, ...props }: StatusBadgeProps) => {
	const iconType = icon;
	const iconClassName = statusBadgeVariants({ variant, icon: iconType });

	return (
		<Badge className={cn(statusBadgeVariants({ variant, className }))} {...props}>
			{iconType === "tick" ? (
				<Check strokeWidth={4} className="size-3!" />
			) : iconType === "dot" ? (
				<IconPointFilled className={`${iconClassName}`} />
			) : (
				<X strokeWidth={4} className="size-3!" />
			)}
			<p>{children}</p>
		</Badge>
	);
};

export default StatusBadge;
