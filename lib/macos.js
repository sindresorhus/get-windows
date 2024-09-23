import path from "node:path";
import { promisify } from "node:util";
import childProcess from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import process from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execFile = promisify(childProcess.execFile);

// Check if the app is packaged
const isPackaged = process.main?.filename.indexOf("app.asar") !== undefined;
console.log(
	"isPackaged ",
	isPackaged,
	process.main?.filename.indexOf("app.asar"),
);

// Set the binary path dynamically for both development and packaged (production) mode
let binary = isPackaged
	? path.join(
			process.resourcesPath,
			"app.asar.unpacked",
			"node_modules",
			"@deepfocus",
			"get-windows",
			"main",
		) // Packaged environment
	: path.join(__dirname, "../main"); // Development environment

console.log("Binary path:", binary);

// Ensure the binary exists
if (!fs.existsSync(binary)) {
	console.error("Binary file does not exist:", binary);
	binary = path.join(__dirname, "../main");
}

// Helper function to parse output
const parseMac = (stdout) => {
	try {
		return JSON.parse(stdout);
	} catch (error) {
		console.error(error);
		throw new Error("Error parsing window data");
	}
};

// Helper function to get arguments for execFile
const getArguments = (options) => {
	const args = [];
	if (options?.accessibilityPermission === false) {
		args.push("--no-accessibility-permission");
	}
	if (options?.screenRecordingPermission === false) {
		args.push("--no-screen-recording-permission");
	}
	return args;
};

// Main function to get the active window
export async function activeWindow(options) {
	const { stdout } = await execFile(binary, getArguments(options));
	return parseMac(stdout);
}

// Synchronous version of activeWindow
export function activeWindowSync(options) {
	const stdout = childProcess.execFileSync(binary, getArguments(options), {
		encoding: "utf8",
	});
	return parseMac(stdout);
}

// Function to get the list of open windows
export async function openWindows(options) {
	const { stdout } = await execFile(binary, [
		...getArguments(options),
		"--open-windows-list",
	]);
	return parseMac(stdout);
}

// Synchronous version of openWindows
export function openWindowsSync(options) {
	const stdout = childProcess.execFileSync(
		binary,
		[...getArguments(options), "--open-windows-list"],
		{ encoding: "utf8" },
	);
	return parseMac(stdout);
}
