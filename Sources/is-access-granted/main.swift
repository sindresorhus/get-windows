/* Executable that will return a JSON with the granted permissions:
 *  {
 * 		"isAccessibilityGranted": boolean
 * 		"isScreenRecordingGranted": boolean
 *	}
 *  
 */

import AppKit

var dictionary: [String: Any] = [
  "isAccessibilityGranted": AXIsProcessTrustedWithOptions(
    ["AXTrustedCheckOptionPrompt": false] as CFDictionary),
  "isScreenRecordingGranted": isScreenRecordingGrantedNoDialog()
]

print(try! toJson(dictionary))

exit(0)
