import { ImageIcon, XCircleIcon } from "lucide-react";
import { useState, useEffect, useCallback, type HtmlHTMLAttributes } from "react";
import Dropzone, { FileRejection } from "react-dropzone";
import { useFormContext } from "react-hook-form";
import {
	ALLOWED_IMAGE_FORMATS,
	getSimpleImgFormats,
	MAX_IMAGE_SIZE,
	SUPABASE_IMAGE_BUCKET_PATH,
} from "@workspace/shared/constants/constants";
import { cn } from "@workspace/shared/utils/ui";

export type ImgDimensions = {
	min: {
		width: number;
		height: number;
	};
	max: {
		width: number;
		height: number;
	};
};

type AspectRatio = "square" | "video" | "wide" | "auto";

type ImageInputProps = {
	name: string;
	dimensions: ImgDimensions;
	className?: HtmlHTMLAttributes<HTMLDivElement>["className"];
	dropZoneClassName?: HtmlHTMLAttributes<HTMLDivElement>["className"];
	showDetails?: boolean;
	aspectRatio?: AspectRatio;
};

type ImagePreviewProps = {
	url: string;
	onRemove: () => void;
	aspectRatio?: AspectRatio;
};

const formatFileSize = (sizeInBytes: number) => {
	const sizeInMB = sizeInBytes / (1024 * 1024);
	return `${sizeInMB.toFixed(0)}MB`;
};

const formatDimensions = (dimensions: { width: number; height: number }) => {
	return `${dimensions.width}×${dimensions.height}`;
};

const getAcceptedFormats = (): { [key: string]: string[] } => {
	const formats = ALLOWED_IMAGE_FORMATS;
	const accept: { [key: string]: string[] } = {};

	formats.forEach((format) => {
		const extension = format.split("/")[1];
		if (!accept["image/*"]) {
			accept["image/*"] = [];
		}
		accept["image/*"].push(`.${extension}`);
	});

	return accept;
};

const ImagePreview = ({ url, onRemove, aspectRatio = "wide" }: ImagePreviewProps) => (
	<div className={`relative w-full rounded-md border border-border ${getAspectRatioClass(aspectRatio)}`}>
		<button
			className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-pointer"
			onClick={onRemove}
		>
			<XCircleIcon className="h-6 w-6 fill-primary text-primary-foreground" />
		</button>
		<img
			src={url}
			alt="Cover Image"
			className="border border-border rounded-md h-full w-full object-cover"
		/>
	</div>
);

const getAspectRatioClass = (ratio?: string) => {
	switch (ratio) {
		case "square":
			return "aspect-square";
		case "video":
			return "aspect-video";
		case "wide":
			return "aspect-4/3";
		case "auto":
			return "aspect-auto";
		default:
			return "aspect-4/3";
	}
};

export default function ImageInput({
	name,
	dimensions,
	className,
	dropZoneClassName,
	showDetails = true,
	aspectRatio = "wide",
}: ImageInputProps) {
	const { setValue, watch, setError, clearErrors } = useFormContext();
	const formValue = watch(name);

	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const validateImage = useCallback(
		(file: File): Promise<string | null> => {
			return new Promise((resolve) => {
				if (!ALLOWED_IMAGE_FORMATS.includes(file.type)) {
					return resolve(`Invalid image format. Only ${getSimpleImgFormats()} are allowed.`);
				}
				if (file.size > MAX_IMAGE_SIZE) {
					console.log(file.size);

					return resolve(`File image exceeds ${formatFileSize(MAX_IMAGE_SIZE)}.`);
				}
				const img = new Image();
				const objectUrl = URL.createObjectURL(file);
				img.onload = () => {
					URL.revokeObjectURL(objectUrl);
					const { width, height } = img;
					if (width < dimensions.min.width || height < dimensions.min.height) {
						resolve(
							`Dimensions must be at least ${dimensions.min.width}x${dimensions.min.height}px.`,
						);
					} else if (width > dimensions.max.width || height > dimensions.max.height) {
						resolve(
							`Dimensions must not exceed ${dimensions.max.width}x${dimensions.max.height}px.`,
						);
					} else {
						resolve(null);
					}
				};
				img.onerror = () => {
					URL.revokeObjectURL(objectUrl);
					resolve(`Failed to load image.`);
				};
				img.src = objectUrl;
			});
		},
		[dimensions],
	);

	useEffect(() => {
		// Handle existing Supabase URL only
		if (typeof formValue === "string" && formValue) {
			setPreviewUrl(`${SUPABASE_IMAGE_BUCKET_PATH}/${formValue}`);
			setUploadError(null);
			clearErrors(name);
		}
		// Do not clear previewUrl for File or null to avoid overriding handleDrop
		return () => {
			// Cleanup is handled in handleDrop and handleRemove
		};
	}, [formValue, name, clearErrors]);

	const handleDrop = async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
		if (rejectedFiles.length > 0) {
			const rejection = rejectedFiles[0];
			let errorMessage = "File rejected.";
			if (rejection.errors.some((err) => err.code === "file-too-large")) {
				errorMessage = `File size exceeds ${formatFileSize(MAX_IMAGE_SIZE)}.`;
			} else if (rejection.errors.some((err) => err.code === "file-invalid-type")) {
				errorMessage = `Invalid file format. Only JPEG, PNG, or WebP are allowed.`;
			}
			setError(name, { type: "manual", message: errorMessage });
			setUploadError(errorMessage);
			setPreviewUrl(null);
			setValue(name, null, { shouldValidate: true });
			return;
		}

		if (acceptedFiles[0]) {
			const file = acceptedFiles[0];
			const error = await validateImage(file);

			if (error) {
				setError(name, { type: "manual", message: error });
				setUploadError(error);
				setPreviewUrl(null);
				setValue(name, null, { shouldValidate: true });
			} else {
				clearErrors(name);
				setUploadError(null);
				const objectUrl = URL.createObjectURL(file);
				setPreviewUrl(objectUrl);
				setValue(name, file, { shouldValidate: true });
			}
		}
	};

	const handleRemove = useCallback(() => {
		if (previewUrl && !previewUrl.startsWith(SUPABASE_IMAGE_BUCKET_PATH)) {
			URL.revokeObjectURL(previewUrl);
		}
		setValue(name, null, { shouldValidate: true });
		clearErrors(name);
		setPreviewUrl(null);
		setUploadError(null);
	}, [setValue, name, clearErrors, previewUrl]);

	const acceptedFormats = getAcceptedFormats();

	return (
		<>
			<div className={cn("w-full max-w-75", className)}>
				{previewUrl && !uploadError ? (
					<ImagePreview url={previewUrl} onRemove={handleRemove} aspectRatio={aspectRatio} />
				) : (
					<Dropzone
						onDrop={handleDrop}
						accept={acceptedFormats}
						maxFiles={1}
						maxSize={MAX_IMAGE_SIZE}
					>
						{({ getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject }) => (
							<div
								{...getRootProps()}
								className={cn(
									"border-2 border-dashed flex items-center justify-center rounded-md focus:outline-none outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors duration-200 ease-in-out p-4",
									{
										"border-primary bg-primary/5": isDragActive && isDragAccept,
										"border-destructive bg-destructive/20": isDragActive && isDragReject,
									},
									dropZoneClassName,
									getAspectRatioClass(aspectRatio),
								)}
							>
								<input {...getInputProps()} id={name} />
								<div className="flex flex-col items-center gap-2">
									<ImageIcon
										className="h-16 w-16 text-muted-foreground"
										strokeWidth={0.85}
									/>
									{showDetails && (
										<div className="px-2 flex flex-col gap-1 justify-center items-center">
											<span className="text-sm text-muted-foreground">
												Drag and drop or click to upload
											</span>
											<span className="text-xs text-muted-foreground">
												{ALLOWED_IMAGE_FORMATS.map(
													(fmt) => `.${fmt.split("/")[1].toUpperCase()}`,
												).join(", ")}
											</span>
											<span className="text-xs text-muted-foreground">
												MAX {formatFileSize(MAX_IMAGE_SIZE)} Supported
											</span>
											<span className="text-xs text-muted-foreground">
												{formatDimensions(dimensions.min)} to{" "}
												{formatDimensions(dimensions.max)}px
											</span>
										</div>
									)}
								</div>
							</div>
						)}
					</Dropzone>
				)}
			</div>
			{uploadError && <span className="text-sm text-destructive">{uploadError}</span>}
		</>
	);
}
