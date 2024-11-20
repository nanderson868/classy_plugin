// exporter.ts -> exporter.js
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
// /* eslint-disable no-undef */
const fs = require("fs-extra");
const path = require("path");
// const process = require("process");

const defaultDestDirName = "dist";
const destDirArgument = process.argv[2];

const destDir = destDirArgument
	? path.resolve(destDirArgument)
	: path.join(__dirname, defaultDestDirName);

async function ensureDirectoryExistence(dirPath: string) {
	try {
		await fs.ensureDir(dirPath);
	} catch (err) {
		console.error(`Failed to ensure directory exists: ${dirPath}`, err);
		process.exit(1);
	}
}

const sourceDir = __dirname; // Adjust this if your source files are in a subdirectory
const filesToCopy = ["main.js", "styles.css", "manifest.json"];

async function copyFiles() {
	await ensureDirectoryExistence(destDir);

	for (const file of filesToCopy) {
		try {
			await fs.copy(path.join(sourceDir, file), path.join(destDir, file));
			console.log(`Successfully copied ${file} to ${destDir}`);
		} catch (err) {
			console.error(`Error copying file: ${file}`, err);
		}
	}
}

copyFiles().catch((err) => console.error("An error occurred:", err));
