import AppKit

func toJson<T>(_ data: T) throws -> String {
	let json = try JSONSerialization.data(withJSONObject: data)
	return String(data: json, encoding: .utf8)!
}

// Show accessibility permissions screen if not enabled; required to get the complete window title
if !AXIsProcessTrustedWithOptions(["AXTrustedCheckOptionPrompt": true] as CFDictionary) {
	print("Active-Win requires permission for accessibility in System Preferences > Security & Privacy > Privacy > Accessibility.")
	exit(1)
}

let frontmostAppPID = NSWorkspace.shared.frontmostApplication!.processIdentifier
let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as! [[String: Any]]

// Show screen recording permissions screen if not enabled; required to get the complete window title
if CGWindowListCreateImage(.null, .optionIncludingWindow, windows[0][kCGWindowNumber as String] as! CGWindowID, [.boundsIgnoreFraming, .bestResolution]) == nil {
    print("Active-Win requires permission for screen recording in System Preferences > Security & Privacy > Privacy > Screen Recording.")
    exit(1)
}

for window in windows {
	let windowOwnerPID = window[kCGWindowOwnerPID as String] as! Int

	if windowOwnerPID != frontmostAppPID {
		continue
	}

	// Skip transparent windows, like with Chrome
	if (window[kCGWindowAlpha as String] as! Double) == 0 {
		continue
	}

	let bounds = CGRect(dictionaryRepresentation: window[kCGWindowBounds as String] as! CFDictionary)!

	// Skip tiny windows, like the Chrome link hover statusbar
	let minWinSize: CGFloat = 50
	if bounds.width < minWinSize || bounds.height < minWinSize {
		continue
	}

	let appPid = window[kCGWindowOwnerPID as String] as! pid_t

	// This can't fail as we're only dealing with apps
	let app = NSRunningApplication(processIdentifier: appPid)!

	let dict: [String: Any] = [
		"title": window[kCGWindowName as String] as? String ?? "",
		"id": window[kCGWindowNumber as String] as! Int,
		"bounds": [
			"x": bounds.origin.x,
			"y": bounds.origin.y,
			"width": bounds.width,
			"height": bounds.height
		],
		"owner": [
			"name": window[kCGWindowOwnerName as String] as! String,
			"processId": appPid,
			"bundleId": app.bundleIdentifier!,
			"path": app.bundleURL!.path
		],
		"memoryUsage": window[kCGWindowMemoryUsage as String] as! Int
	]

	print(try! toJson(dict))
	exit(0)
}

print("null")
exit(0)
