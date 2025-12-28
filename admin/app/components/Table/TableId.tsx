import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function TableCopyField({ id, message = "ID Copied" }: { id: string; message?: string }) {
	const [isCopied, setIsCopied] = useState(false);

	const truncatedId = id.length > 25 ? `${id.substring(0, 25)}...` : id;

	const handleCopy = () => {
		try {
			navigator.clipboard.writeText(id);
		} catch (error) {
			console.error("Error copying to clipboard:", error);
		}

		toast.success(message.trim(), {
			description: id,
		});

		setIsCopied(true);

		setTimeout(() => {
			setIsCopied(false);
		}, 1500);
	};

	return (
		<div>
			<button
				className="flex gap-2 w-fit bg-table-row-muted-button dark:bg-muted rounded-sm px-3 py-1 cursor-pointer"
				onClick={handleCopy}
				style={{
					whiteSpace: "nowrap",
					overflow: "hidden",
					textOverflow: "ellipsis",
					maxWidth: "300px",
				}}
				disabled={isCopied}
			>
				{isCopied ? (
					<Check strokeWidth={1.65} width={13} className="self-center shrink-0" />
				) : (
					<Copy strokeWidth={1.65} width={13} className="self-center shrink-0" />
				)}
				<span>{truncatedId}</span>
			</button>
		</div>
	);
}
