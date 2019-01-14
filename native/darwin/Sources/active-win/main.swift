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

func getActiveWindow(pid: pid_t) throws -> (window:[String: Any], bounds:CGRect) {
	let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as! [[String: Any]]

	for window in windows {
		
		let windowOwnerPID = window[kCGWindowOwnerPID as String] as! Int

		if windowOwnerPID != pid {
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
		return (window, bounds);
	}
	throw "No matching window found"
}

func toJson<T>(_ data: T) throws -> String {
	let json = try JSONSerialization.data(withJSONObject: data)
	return String(data: json, encoding: .utf8)!
}

func getConfig() throws -> [String: Any] {
	// This can't fail as we're only dealing with apps
	let frontmostApp = NSWorkspace.shared.frontmostApplication!
	let pid = frontmostApp.processIdentifier

	let (window, bounds) = try! getActiveWindow(pid: pid);
	let screens = getScreens(bounds: bounds)

	if screens == nil {
		throw "No screens for window"
	}

	let ref = NSRunningApplication(processIdentifier: pid)!;

	let dict: [String: Any] = [
		"title": window[kCGWindowName as String] as? String ?? "",
		"id": window[kCGWindowNumber as String] as! Int,
		"bounds": [
			"x": bounds.origin.x,
			"y": bounds.origin.y,
			"width": bounds.width,
			"height": bounds.height
		],
		"screens": screens!.map {
			[	
				"x": $0.ref.frame.origin.x,
				"y": $0.ref.frame.origin.y,
				"width": $0.ref.frame.width,
				"height": $0.ref.frame.height,
				"index": $0.index
			]
		},
		"owner": [
			"name": window[kCGWindowOwnerName as String] as! String,
			"processId": pid,
			"bundleId": ref.bundleIdentifier!,
			"path": ref.bundleURL!.path
		],
		"memoryUsage": window[kCGWindowMemoryUsage as String] as! Int
	]

	return dict
}


let config = try! getConfig()
print(try! toJson(config))
exit(0)
