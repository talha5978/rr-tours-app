import slugify from "slugify";
import { v4 as uuidv4 } from "uuid";

const generateFileSlug = (fileName: string) => {
	const fileSlug = slugify(fileName, {
		lower: true,
		strict: true,
		trim: true,
		replacement: "_", // replace non-word characters with underscores
		remove: /[^a-zA-Z0-9 _-]/g, // remove non-alphanumeric characters
	});
	return fileSlug;
};

const generateFilePath = (file: File) => {
	const fileSlug = generateFileSlug(file.name);
	const filePath = `${fileSlug}-${uuidv4()}`;
	return filePath;
};

export { generateFilePath };
