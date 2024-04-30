// swift-tools-version:5.9
import PackageDescription

let package = Package(
	name: "GetWindows",
	products: [
		.executable(
			name: "get-windows",
			targets: [
				"GetWindowsCLI"
			]
		)
	],
	targets: [
		.executableTarget(
			name: "GetWindowsCLI"
		)
	]
)
