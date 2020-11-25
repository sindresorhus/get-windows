import AppKit

func toJson<T>(_ data: T) throws -> String {
	let json = try JSONSerialization.data(withJSONObject: data)
	return String(decoding: json, as: UTF8.self)
}

/**
 *  Returns true if the Screen recording is granted by the user for this app. False
 *  otherwise.
 *	This method will not prompt the user with a dialog to grant permissions
 *  CREDITS: https://gist.github.com/soffes/da6ea98be4f56bc7b8e75079a5224b37
 */
func isScreenRecordingGrantedNoDialog() -> Bool {
  // The screen recording security was introduced in version 10.15 of MAC os
  if #available(macOS 10.15, *) {
    let runningApplication = NSRunningApplication.current
    let processIdentifier = runningApplication.processIdentifier

    guard let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly], kCGNullWindowID)
      as? [[String: AnyObject]] else
    {
      assertionFailure("Invalid window info")
      return false
    }

    for window in windows {
      // Get information for each window
      guard let windowProcessIdentifier = (window[String(kCGWindowOwnerPID)] as? Int).flatMap(pid_t.init) else {
        assertionFailure("Invalid window info")
        continue
      }

      // Don't check windows owned by this process
      if windowProcessIdentifier == processIdentifier {
        continue
      }

      // Get process information for each window
      guard let windowRunningApplication = NSRunningApplication(processIdentifier: windowProcessIdentifier) else {
        // Ignore processes we don't have access to, such as WindowServer, which manages the windows named
        // "Menubar" and "Backstop Menubar"
        continue
      }

      if window[String(kCGWindowName)] as? String != nil {
        if windowRunningApplication.executableURL?.lastPathComponent == "Dock" {
          // Ignore the Dock, which provides the desktop picture
          continue
        } else {
          return true
        }
      }
    }
    return false
  } else {
    return true;
  }
}