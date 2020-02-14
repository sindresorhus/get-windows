import AppKit

// Uses AppleScript to get the browser URL from Chrome or Safari
func getBrowserURL(_ appName: String) -> String? {
	// Gets the appropriate AppleScript for each browser type
	guard let scriptText = getScriptText(appName) else { return nil }
	
	// Prepare and execute AppleScript script to query URL
	var error: NSDictionary?
	guard let script = NSAppleScript(source: scriptText) else { return nil }
	guard let outputString = script.executeAndReturnError(&error).stringValue else { return nil }
	
	// Parse URL and return if present
	if let url = URL(string: outputString) {
		return url
	}

	return nil
}

// Formats the AppleScript text for Chrome and Safari
func getScriptText(_ appName: String) -> String? {
	switch appName {
	case "Google Chrome":
		return "tell app \"Google Chrome\" to get the url of the active tab of window 1"
	case "Safari":
		return "tell application \"Safari\" to return URL of front document"
	case "Firefox":
		return "`tell application \"Firefox\" to activate\r\ntell application \"System Events\"\r\nkeystroke \"l\" using command down\r\nkeystroke \"c\" using command down\r\nend tell\r\ndelay 0.5\r\nreturn the clipboard`"
	default:
		return nil
	}
}

// Shows the system prompt if there's no permission.
func hasScreenRecordingPermission() -> Bool {
	CGDisplayStream(
		dispatchQueueDisplay: CGMainDisplayID(),
		outputWidth: 1,
		outputHeight: 1,
		pixelFormat: Int32(kCVPixelFormatType_32BGRA),
		properties: nil,
		queue: DispatchQueue.global(),
		handler: { _, _, _, _ in }
	) != nil
}

// Serializes data dict to JSON
func toJson<T>(_ data: T) throws -> String {
	let json = try JSONSerialization.data(withJSONObject: data)
	return String(data: json, encoding: .utf8)!
}

// Show accessibility permission prompt if needed. Required to get the complete window title.
if !AXIsProcessTrustedWithOptions(["AXTrustedCheckOptionPrompt": true] as CFDictionary) {
	print("active-win requires the accessibility permission in “System Preferences › Security & Privacy › Privacy › Accessibility”.")
	exit(1)
}

let frontmostAppPID = NSWorkspace.shared.frontmostApplication!.processIdentifier
let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as! [[String: Any]]

// Show screen recording permission prompt if needed. Required to get the complete window title.
if !hasScreenRecordingPermission() {
	print("active-win requires the screen recording permission in “System Preferences › Security & Privacy › Privacy › Screen Recording”.")
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
	let appName = window[kCGWindowOwnerName as String] as! String
	let browserURL = getBrowserURL(appName)

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
			"name": appName,
			"processId": appPid,
			"bundleId": app.bundleIdentifier!,
			"path": app.bundleURL!.path
		],
		"memoryUsage": window[kCGWindowMemoryUsage as String] as! Int
	]

	if browserURL {
		dict["owner"]["url"] = browserURL as String? ?? ""
	}

	print(try! toJson(dict))
	exit(0)
}

print("null")
exit(0)
