import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Copy, Facebook, Twitter, Linkedin, Share } from "lucide-react";

type ShareDialogProps = {
	url: string;
};

export function ShareDialog({ url }: ShareDialogProps) {
	const [copied, setCopied] = React.useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const encodedUrl = encodeURIComponent(url);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost">
					<Share className="h-4 w-4" />
					<span className="mt-1">Share</span>
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Share link</DialogTitle>
				</DialogHeader>

				{/* Share buttons */}
				<div className="grid grid-cols-3 gap-2">
					<ShareButton
						href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
						icon={<Facebook className="h-4 w-4" />}
						label="Facebook"
					/>
					<ShareButton
						href={`https://twitter.com/intent/tweet?url=${encodedUrl}`}
						icon={<Twitter className="h-4 w-4" />}
						label="Twitter"
					/>
					<ShareButton
						href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
						icon={<Linkedin className="h-4 w-4" />}
						label="LinkedIn"
					/>
				</div>

				{/* Copy link */}
				<div className="mt-4 space-y-2">
					<label className="text-sm text-muted-foreground">Shareable link</label>
					<div className="flex gap-2">
						<Input readOnly value={url} />
						<Button onClick={handleCopy} className="shrink-0">
							<Copy className="h-4 w-4 mr-1" />
							{copied ? "Copied" : "Copy"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function ShareButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
		>
			{icon}
			<span className="max-md:hidden">{label}</span>
		</a>
	);
}
