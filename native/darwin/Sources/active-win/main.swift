import AppKit

extension String: Error {}

func getScreens(bounds: CGRect) -> [(index:Int, ref:NSScreen)]? {
		var index = 0
		var out: [(index:Int, ref:NSScreen)] = [];
    for screen in NSScreen.screens
    {
			if (screen.frame.intersects(bounds))
			{
				out.append((index: index, ref: screen))
			}
			index += 1
    }
		if (out.count == 0) {
			return nil;
		}
		return out
}

func getActiveApp() throws -> (pid: pid_t, screens: [(index:Int, ref:NSScreen)], ref: NSRunningApplication, window: [String: Any], bounds: CGRect) {

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
		let screens = getScreens(bounds: bounds)

		if screens == nil {
			continue
		}

		return (
			pid:  pid,
			screens: screens!,
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
		"screens": app.screens.map {
			[	
				"x": $0.ref.frame.origin.x,
				"y": $0.ref.frame.origin.y,
				"width": $0.ref.frame.width,
				"height": $0.ref.frame.height,
				"index": $0.index
			]
		},
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
