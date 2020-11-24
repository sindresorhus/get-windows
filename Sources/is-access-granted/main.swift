/* Executable that will return a JSON with the granted permissions:
 *  {
 * 		"isAccessibilityGranted": boolean
 * 		"isScreenRecordingGranted": boolean
 *	}
 *  
 */

import AppKit

func toJson<T>(_ data: T) throws -> String {
	let json = try JSONSerialization.data(withJSONObject: data)
	return String(data: json, encoding: .utf8)!
}

/**
 *  Returns true if the Screen recording is granted by the user for this app. False
 *  otherwise.
 *  CREDITS: 
 *  https://github.com/karaggeorge/mac-screen-capture-permissions/blob/master/Sources/screen-capture-permissions/ScreenCapturePermissions.swift
 */
func isScreenRecordingGranted() -> Bool {
    let stream = CGDisplayStream(
      dispatchQueueDisplay: CGMainDisplayID(),
      outputWidth: 1,
      outputHeight: 1,
      pixelFormat: Int32(kCVPixelFormatType_32BGRA),
      properties: nil,
      queue: DispatchQueue.global(),
      handler: { _, _, _, _ in }
    )

    return stream != nil
}

var dictionary: [String: Any] = [
  "isAccessibilityGranted": AXIsProcessTrustedWithOptions(
    ["AXTrustedCheckOptionPrompt": false] as CFDictionary),
  "isScreenRecordingGranted": isScreenRecordingGranted()
]

print(try! toJson(dictionary))

exit(0)
