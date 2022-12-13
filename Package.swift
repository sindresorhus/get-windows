// swift-tools-version:5.6
import PackageDescription

let package = Package(
	name: "ActiveWin",
	products: [
		.executable(
			name: "active-win",
			targets: [
				"ActiveWinCLI"
			]
		)
	],
	targets: [
		.executableTarget(
			name: "ActiveWinCLI"
		)
	]
)
