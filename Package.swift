// swift-tools-version:5.1
import PackageDescription

let package = Package(
	name: "active-win",
	targets: [
		.target(name: "active-win"),
		.target(
			name: "is-access-granted",
			path: "Sources/is-access-granted")
	]
)
