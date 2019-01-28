import AppKit

extension String: Error {}

func getScreens(bounds: CGRect) -> [(index:Int, bounds:CGRect)]? {
    var index = 0
    var out: [(index:Int, bounds:CGRect)] = [];
    for screen in NSScreen.screens
    {
      let displayID = screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as! uint;
      let screenFrame = CGDisplayBounds(displayID);

      if (screenFrame.intersects(bounds))
      {
        out.append((index: index, bounds: screenFrame))
      }
      index += 1
    }
    if (out.count == 0) {
      return nil;
    }
    return out;
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

func getConfig() throws -> String {
  // This can't fail as we're only dealing with apps
  let frontmostApp = NSWorkspace.shared.frontmostApplication!
  let pid = frontmostApp.processIdentifier

  let (window, bounds) = try! getActiveWindow(pid: pid);
  let screens = getScreens(bounds: bounds)

  if screens == nil {
    throw "No screens for window"
  }

  let ref = NSRunningApplication(processIdentifier: pid)!;

  let json = """
{
  "title": "\(window[kCGWindowName as String] as? String ?? "")",
  "id": \(window[kCGWindowNumber as String] as! Int),
  "bounds": {
    "x": \(bounds.origin.x),
    "y": \(bounds.origin.y),
    "width": \(bounds.width),
    "height": \(bounds.height)
  },
  "screens": [\(screens!.map {
    """
    {	
      "x": \($0.bounds.minX),
      "y": \($0.bounds.minY),
      "width": \($0.bounds.width),
      "height": \($0.bounds.height),
      "index": \($0.index)
    }
    """
  } .joined(separator: ","))
  ],
  "owner": {
    "name": "\(window[kCGWindowOwnerName as String] as! String)",
    "processId": \(pid),
    "bundleId": "\(ref.bundleIdentifier!)",
    "path": "\(ref.bundleURL!.path)"
  },
  "memoryUsage": \(window[kCGWindowMemoryUsage as String] as! Int)
}
""";

  return json
}

let config = try! getConfig()
print(config)
exit(0)
