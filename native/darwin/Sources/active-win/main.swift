import AppKit

extension String: Error {}

func getScreen(bounds: CGRect) -> (index:Int, ref:NSScreen)? {
		var index = 0
    for screen in NSScreen.screens
    {
			if (screen.frame.intersects(bounds))
			{
				print("index", index)
				return (index: index, ref: screen)
			}
			index += 1
    }
		return nil
}

func getActiveApp() throws -> (pid: pid_t, screenIndex: Int, screen: NSScreen, ref: NSRunningApplication, window: [String: Any], bounds: CGRect) {

	let frontmostApp = NSWorkspace.shared.frontmostApplication!
	let frontmostAppPID = frontmostApp.processIdentifier
	let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as! [[String: Any]]

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

		let pid = window[kCGWindowOwnerPID as String] as! pid_t
		let screen = getScreen(bounds: bounds)

		if screen == nil {
			continue
		}

		return (
			pid:  pid,
			screenIndex: screen!.index,
			screen: screen!.ref,
			ref: NSRunningApplication(processIdentifier: pid)!,
			window: window,
			bounds: bounds
		)
	}
	throw "Invalid"
}

func toJson<T>(_ data: T) throws -> String {
	let json = try JSONSerialization.data(withJSONObject: data)
	return String(data: json, encoding: .utf8)!
}

func getConfig() throws -> [String: Any] {
	// This can't fail as we're only dealing with apps
	let app = try! getActiveApp()

	let dict: [String: Any] = [
		"title": app.window[kCGWindowName as String] as? String ?? "",
		"id": app.window[kCGWindowNumber as String] as! Int,
		"bounds": [
			"x": app.bounds.origin.x,
			"y": app.bounds.origin.y,
			"width": app.bounds.width,
			"height": app.bounds.height
		],
		"screen": [	
			"x": app.screen.frame.origin.x,
			"y": app.screen.frame.origin.y,
			"width": app.screen.frame.width,
			"height": app.screen.frame.height,
			"index": app.screenIndex
		],
		"owner": [
			"name": app.window[kCGWindowOwnerName as String] as! String,
			"processId": app.pid,
			"bundleId": app.ref.bundleIdentifier!,
			"path": app.ref.bundleURL!.path
		],
		"memoryUsage": app.window[kCGWindowMemoryUsage as String] as! Int
	]

	return dict
}


let config = try! getConfig()
print(try! toJson(config))
exit(0)
