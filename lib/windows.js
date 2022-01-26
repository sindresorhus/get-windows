/* eslint-disable new-cap */
'use strict';
const path = require('path');
const ffi = require('ffi-napi');
const wchar = require('ref-wchar-napi');
const ref = require('ref-napi');
const struct = require('ref-struct-di')(ref);

// Create the struct required to save the window bounds
const Rect = struct({
	left: 'long',
	top: 'long',
	right: 'long',
	bottom: 'long'
});
const RectPointer = ref.refType(Rect);
const VoidPointer = ref.refType(ref.types.void);

// Required by QueryFullProcessImageName
// https://msdn.microsoft.com/en-us/library/windows/desktop/ms684880(v=vs.85).aspx
const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;

// Create FFI declarations for the C++ library and functions needed (User32.dll), using their "Unicode" (UTF-16) version
const user32 = new ffi.Library('User32.dll', {
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms633505(v=vs.85).aspx
	GetForegroundWindow: ['pointer', []],
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms633520(v=vs.85).aspx
	GetWindowTextW: ['int', ['pointer', 'pointer', 'int']],
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms633521(v=vs.85).aspx
	GetWindowTextLengthW: ['int', ['pointer']],
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms633522(v=vs.85).aspx
	GetWindowThreadProcessId: ['uint32', ['pointer', 'uint32 *']],
	// Get window bounds function
	// https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-getwindowrect
	GetWindowRect: ['bool', ['pointer', RectPointer]],
	// Iterate through child windows
	// https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumchildwindows
	EnumChildWindows: ['bool', ['pointer', VoidPointer, 'int32']]
});

const SIZE_T = 'uint64';

// https://docs.microsoft.com/en-us/windows/desktop/api/psapi/ns-psapi-_process_memory_counters
const ProcessMemoryCounters = struct({
	cb: 'uint32',
	PageFaultCount: 'uint32',
	PeakWorkingSetSize: SIZE_T,
	WorkingSetSize: SIZE_T,
	QuotaPeakPagedPoolUsage: SIZE_T,
	QuotaPagedPoolUsage: SIZE_T,
	QuotaPeakNonPagedPoolUsage: SIZE_T,
	QuotaNonPagedPoolUsage: SIZE_T,
	PagefileUsage: SIZE_T,
	PeakPagefileUsage: SIZE_T
});

const ProcessMemoryCountersPointer = ref.refType(ProcessMemoryCounters);

// Create FFI declarations for the C++ library and functions needed (psapi.dll)
const psapi = new ffi.Library('psapi', {
	// https://docs.microsoft.com/en-us/windows/desktop/api/psapi/nf-psapi-getprocessmemoryinfo
	GetProcessMemoryInfo: ['int', ['pointer', ProcessMemoryCountersPointer, 'uint32']]
});

// Create FFI declarations for the C++ library and functions needed (Kernel32.dll), using their "Unicode" (UTF-16) version
const kernel32 = new ffi.Library('kernel32', {
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms684320(v=vs.85).aspx
	OpenProcess: ['pointer', ['uint32', 'int', 'uint32']],
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms724211(v=vs.85).aspx
	CloseHandle: ['int', ['pointer']],
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms684919(v=vs.85).aspx
	QueryFullProcessImageNameW: ['int', ['pointer', 'uint32', 'pointer', 'pointer']]
});

// Create FFI declarations for the C++ library and functions needed (version.dll)
const version = new ffi.Library('version', {
	GetFileVersionInfoSizeW: ['uint32', ['string', 'uint32']],
	GetFileVersionInfoW: ['int32', ['string', 'uint32', 'uint32', 'pointer']],
	VerLanguageNameW: ['int32', ['uint32', 'pointer', 'uint32']],
	VerQueryValueW: ['int32', ['pointer', 'pointer', VoidPointer, 'uint32 *']]
});

function toWstring(string) {
	return ref.allocCString(`${string}\0`, 'ucs2');
}

function getLanguageId(mem) {
	const enUsLanguageId = 0x040904E4;
	const value = ref.alloc(VoidPointer);
	const size = ref.alloc('uint32', 1);
	const result = version.VerQueryValueW(mem, toWstring(String.raw`\\VarFileInfo\\Translation`), value, size);
	if (result) {
		const number = ref.readPointer(value, 0, 4);
		return (number.readUInt16LE(0) << 16) | number.readUInt16LE(2);
	}

	return enUsLanguageId;
}

function hexString(value) {
	return ('00000000' + value.toString(16)).slice(-8);
}

function getFileVersionString(block, name) {
	const value = ref.alloc(VoidPointer);
	const size = ref.alloc('uint32', 0);
	const result = version.VerQueryValueW(block, toWstring(name), value, size);
	let data;
	if (result) {
		const buffer = ref.readPointer(value, 0, size.deref() * wchar.size);
		data = wchar.toString(ref.reinterpretUntilZeros(buffer, wchar.size));
	}

	return data;
}

function getVersionInfoForCodePage(block, codePage) {
	return getFileVersionString(block, String.raw`StringFileInfo\\${codePage}\\FileDescription`);
}

// Check parent window for SubWindows and find the unique process inside of it.
function getSubWindowRealProcessNameAndPath(activeWindowHandle, processName, processPath) {
	let [newProcessName, newProcessPath] = [processName, processPath];

	const windowProcess = ffi.Callback('bool', ['pointer', 'int32'], hwnd => {
		// Return the Process ID & Process Handle from the Active Window Handle
		const [, processHandle] = getProcessIdAndHandle(hwnd);

		if (ref.isNull(processHandle)) {
			return false; // Failed to get process handle
		}

		const [processNameChild, processPathChild] = getProcessNameAndPath(processHandle);

		if (processPathChild !== processPath) {
			[newProcessName, newProcessPath] = [processNameChild, processPathChild];
			return false;
		}

		return true;
	});

	user32.EnumChildWindows(activeWindowHandle, windowProcess, 0);

	return [newProcessName, newProcessPath];
}

function getProcessNameAndPath(processHandle) {
	if (ref.isNull(processHandle)) {
		return undefined;
	}

	// Set the path length to more than the Windows extended-length MAX_PATH length
	// The maximum path of 32,767 characters is approximate, because the "\\?\" prefix may be expanded to a longer string by the system at run time, and this expansion applies to the total length.
	const pathLengthBytes = 66000;
	// Path length in "characters"
	const pathCharacterCount = Math.floor(pathLengthBytes / 2);
	// Allocate a buffer to store the path of the process
	const processFileNameBuffer = Buffer.alloc(pathLengthBytes);
	// Create a buffer containing the allocated size for the path, as a buffer as it must be writable
	const processFileNameSizeBuffer = ref.alloc('uint32', pathCharacterCount);
	// Write process file path to buffer
	kernel32.QueryFullProcessImageNameW(processHandle, 0, processFileNameBuffer, processFileNameSizeBuffer);
	// Remove null characters from buffer
	const processFileNameBufferClean = ref.reinterpretUntilZeros(processFileNameBuffer, wchar.size);
	// Get process file path as a string
	const processPath = wchar.toString(processFileNameBufferClean);
	let processName = path.basename(processPath);

	const unused = ref.alloc('uint32', 1);
	const infoSize = version.GetFileVersionInfoSizeW(processFileNameBufferClean, unused);
	if (infoSize !== 0) {
		// Get data from the FileVersionInfo struct
		const block = new Buffer.alloc(infoSize);
		if (version.GetFileVersionInfoW(processFileNameBufferClean, 0, infoSize, block)) {
			// Get file description from the FileVersionInfo struct
			const langId = getLanguageId(block);
			const fileDescription = getVersionInfoForCodePage(block, hexString(langId));
			processName = fileDescription && fileDescription.trim() ? fileDescription : processName;
		}
	}

	return [processName, processPath];
}

function getProcessIdAndHandle(windowHandle) {
	// Allocate a buffer to store the process ID
	const processIdBuffer = ref.alloc('uint32');
	// Write the process ID creating the window to the buffer (it returns the thread ID, but it's not used here)
	user32.GetWindowThreadProcessId(windowHandle, processIdBuffer);
	// Get the process ID as a number from the buffer
	const processId = ref.get(processIdBuffer);
	// Get a "handle" of the process
	const processHandle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, processId);

	return [processId, processHandle];
}

function windows() {
	// Windows C++ APIs' functions are declared with capitals, so this rule has to be turned off

	// Get a "handle" of the active window
	const activeWindowHandle = user32.GetForegroundWindow();

	if (ref.isNull(activeWindowHandle)) {
		return undefined; // Failed to get active window handle
	}

	// Get memory address of the window handle as the "window ID"
	const windowId = ref.address(activeWindowHandle);
	// Get the window text length in "characters" to create the buffer
	const windowTextLength = user32.GetWindowTextLengthW(activeWindowHandle);
	// Allocate a buffer large enough to hold the window text as "Unicode" (UTF-16) characters (using ref-wchar-napi)
	// This assumes using the "Basic Multilingual Plane" of Unicode, only 2 characters per Unicode code point
	// Include some extra bytes for possible null characters
	const windowTextBuffer = Buffer.alloc((windowTextLength * 2) + 4);
	// Write the window text to the buffer (it returns the text size, but it's not used here)
	user32.GetWindowTextW(activeWindowHandle, windowTextBuffer, windowTextLength + 2);
	// Remove trailing null characters
	const windowTextBufferClean = ref.reinterpretUntilZeros(windowTextBuffer, wchar.size);
	// The text as a JavaScript string
	const windowTitle = wchar.toString(windowTextBufferClean);

	// Return the Process ID & Process Handle from the Active Window Handle
	const [processId, processHandle] = getProcessIdAndHandle(activeWindowHandle);

	if (ref.isNull(processHandle)) {
		return undefined; // Failed to get process handle
	}

	// Return the Process Path & Process Name from a Process Handle
	let [processName, processPath] = getProcessNameAndPath(processHandle);

	// ApplicationFrameHost & Universal Windows Platform Support
	if (path.basename(processPath) === 'ApplicationFrameHost.exe') {
		[processName, processPath] = getSubWindowRealProcessNameAndPath(activeWindowHandle, processName, processPath);
	}

	// Get process memory counters
	const memoryCounters = new ProcessMemoryCounters();
	memoryCounters.cb = ProcessMemoryCounters.size;
	const getProcessMemoryInfoResult = psapi.GetProcessMemoryInfo(processHandle, memoryCounters.ref(), ProcessMemoryCounters.size);

	// Close the "handle" of the process
	kernel32.CloseHandle(processHandle);
	// Create a new instance of Rect, the struct required by the `GetWindowRect` method
	const bounds = new Rect();
	// Get the window bounds and save it into the `bounds` variable
	const getWindowRectResult = user32.GetWindowRect(activeWindowHandle, bounds.ref());

	if (getProcessMemoryInfoResult === 0) {
		return undefined; // Failed to get process memory
	}

	if (getWindowRectResult === 0) {
		return undefined; // Failed to get window rect
	}

	return {
		platform: 'windows',
		title: windowTitle,
		id: windowId,
		owner: {
			name: processName,
			processId,
			path: processPath
		},
		bounds: {
			x: bounds.left,
			y: bounds.top,
			width: bounds.right - bounds.left,
			height: bounds.bottom - bounds.top
		},
		memoryUsage: memoryCounters.WorkingSetSize
	};

	/* eslint-enable new-cap */
}

module.exports = () => Promise.resolve(windows());
module.exports.sync = windows;
