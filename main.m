@import AppKit;

int main() {
	@autoreleasepool {
		NSInteger frontmostAppPID = [[NSWorkspace sharedWorkspace] frontmostApplication].processIdentifier;
		NSArray* windows = CFBridgingRelease(CGWindowListCopyWindowInfo(kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements, kCGNullWindowID));

		for (NSDictionary* window in windows) {
			NSInteger windowOwnerPID = [[window objectForKey:(id)kCGWindowOwnerPID] intValue];

			if (windowOwnerPID == frontmostAppPID) {
				NSString* title = [window objectForKey:(id)kCGWindowName];
				NSInteger winId = [[window objectForKey:(id)kCGWindowNumber] intValue];
				NSString* app = [window objectForKey:(id)kCGWindowOwnerName];
				NSInteger pid = [[window objectForKey:(id)kCGWindowOwnerPID] intValue];
				printf("%s\n%ld\n%s\n%ld\n", title.UTF8String, winId, app.UTF8String, pid);
				return 0;
			}
		}
	}

	return 1;
}
