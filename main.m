@import AppKit;

int main() {
	@autoreleasepool {
		NSInteger frontmostAppPID = [NSWorkspace sharedWorkspace].frontmostApplication.processIdentifier;
		NSArray* windows = CFBridgingRelease(CGWindowListCopyWindowInfo(kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements, kCGNullWindowID));

		for (NSDictionary* window in windows) {
			NSInteger windowOwnerPID = [window[(id)kCGWindowOwnerPID] intValue];

			if (windowOwnerPID == frontmostAppPID) {
				// Skip transparent windows, like with Chrome
				if ([window[(id)kCGWindowAlpha] intValue] == 0) {
					continue;
				}

				// Skip tiny windows, like the Chrome link hover statusbar
				int minWinSize = 50;
				NSDictionary* winBounds = window[(id)kCGWindowBounds];
				if ([winBounds[@"Height"] intValue] < minWinSize ||
					[winBounds[@"Width"] intValue] < minWinSize) {
					continue;
				}

				NSString* title = window[(id)kCGWindowName];
				NSInteger winId = [window[(id)kCGWindowNumber] intValue];
				NSString* app = window[(id)kCGWindowOwnerName];
				NSInteger pid = [window[(id)kCGWindowOwnerPID] intValue];
				printf("%s\n%ld\n%s\n%ld\n", title.UTF8String, winId, app.UTF8String, pid);

				return 0;
			}
		}
	}

	return 1;
}
