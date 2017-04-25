'use strict';
const path = require('path');

const ffi = require('ffi');
const ref = require('ref');
const wchar_t = require('ref-wchar');

// Required by QueryFullProcessImageName
// https://msdn.microsoft.com/en-us/library/windows/desktop/ms684880(v=vs.85).aspx
const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;

// ffi declarations for the C++ library and functions needed (User32.dll), using their "Unicode" (UTF-16) version
const user32 = ffi.Library('user32', {
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms633505(v=vs.85).aspx
	'GetForegroundWindow': ['pointer', []],
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms633520(v=vs.85).aspx
	'GetWindowTextW': ['int', ['pointer', 'pointer', 'int']],
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms633521(v=vs.85).aspx
	'GetWindowTextLengthW': ['int', ['pointer']],
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms633522(v=vs.85).aspx
	'GetWindowThreadProcessId': ['uint32', ['pointer', 'uint32 *']],
});

// ffi declarations for the C++ library and functions needed (Kernel32.dll), using their "Unicode" (UTF-16) version
const kernel32 = ffi.Library('kernel32', {
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms684320(v=vs.85).aspx
	'OpenProcess': ['pointer', ['uint32', 'int', 'uint32']],
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms724211(v=vs.85).aspx
	'CloseHandle': ['int', ['pointer']],
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms684919(v=vs.85).aspx
	'QueryFullProcessImageNameW': ['int', ['pointer', 'uint32', 'pointer', 'pointer']],
});

module.exports = () => {
	// Get a "handle" of the active window
	const activeWindowHandle = user32.GetForegroundWindow();
	// Get the window text length in "characters", to create the buffer
	const windowTextLength = user32.GetWindowTextLengthW(activeWindowHandle);
	// Allocate a buffer large enough to hold the window text as "Unicode" (UTF-16) characters (using ref-wchar)
	// This assumes using the "Basic Multilingual Plane" of Unicode, only 2 characters per Unicode code point
	// Include some extra bytes for possible null characters
	const windowTextBuffer = Buffer.alloc(windowTextLength * 2 + 4);
	// Write the window text to the buffer
	const windowTextSize = user32.GetWindowTextW(activeWindowHandle, windowTextBuffer, windowTextLength + 2);
	// Remove trailing null characters
	const windowTextBufferClean = ref.reinterpretUntilZeros(windowTextBuffer, wchar_t.size)
	// The the text as a Javascript string
	const windowTitle = wchar_t.toString(windowTextBufferClean);

	// Allocate a buffer to store the process ID
	const processIdBuffer = ref.alloc('uint32');
	// Write the process ID creating the window to the buffer
	const threadId = user32.GetWindowThreadProcessId(activeWindowHandle, processIdBuffer);
	// get the process ID as a number from the buffer
	const processId = ref.get(processIdBuffer);
	// Get a "handle" of the process
	let processHandle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, processId);
	// Set the path length to more than the Windows extended-length MAX_PATH length
	const pathLengthBytes = 66000;
	// Path length in "characters"
	const pathLengthChars = Math.floor(pathLengthBytes / 2);
	// Allocate a buffer to store the path of the process
	const processFileNameBuffer = Buffer.alloc(pathLengthBytes);
	// Create a buffer containing the allocated size for the path, as a buffer as it must be writable
	const processFileNameSizeBuffer = ref.alloc('uint32', pathLengthChars);
	// Write process file path to buffer
	kernel32.QueryFullProcessImageNameW(processHandle, 0, processFileNameBuffer, processFileNameSizeBuffer);
	// Remove null characters from buffer
	const processFileNameBufferClean = ref.reinterpretUntilZeros(processFileNameBuffer, wchar_t.size);
	// Get process file path as a string
	const processPath = wchar_t.toString(processFileNameBufferClean);
	// Get process file name from path
	const processName = path.basename(processPath);
	// Close the "handle" of the process
	kernel32.CloseHandle(processHandle);

	return {
		title: windowTitle,
		// There doesn't seem to be a notion of "window ID" in Windows, so returning -1
		id: -1,
		app: processName,
		pid: processId,
	};
}
