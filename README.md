# Dime

Dime is a bilingual conversation app for iPhone Duo. The fold is the interface: closed to prepare, book pose to talk face to face, and fully open to share one recap.

The hackathon MVP is the healthcare path in English and Español. You type or speak the context, choose English ↔ Español, then open the phone. Your side stays upright in English. The provider’s side is turned so Español reads from the opposite seat. The seeded prenatal conversation, clarification, and interpreter request work without a backend. Saving the recap is the only Dime Más step, through RevenueCat’s Test Store.

## Run the demo

Open `Dime.xcworkspace` in Xcode 27.1, or open the Dime project in Bitrig and choose **Run on… → iPhone Duo**.

1. Closed: choose Healthcare, speak or type the context, save, choose English ↔ Español, then Okay.
2. Book pose: play the seeded conversation. You read English. The provider reads Español.
3. Fully open: read the shared recap. Save this recap uses the local Test Store key.

The RevenueCat Test Store key stays in `Config/Secrets.xcconfig`, which is gitignored. Copy that file locally and set `REVENUECAT_TEST_STORE_API_KEY` before exercising the paywall. The app still builds without it.

## Project layout

Feature code lives in `DimePackage`. The app target is a thin shell.

## AI Assistant Rules Files

This template includes **opinionated rules files** for popular AI coding assistants. These files establish coding standards, architectural patterns, and best practices for modern iOS development using the latest APIs and Swift features.

### Included Rules Files
- **Claude Code**: `CLAUDE.md` - Claude Code rules
- **Editor rules**: `.cursor/*.mdc`
- **GitHub Copilot**: `.github/copilot-instructions.md` - GitHub Copilot rules

### Customization Options
These rules files are **starting points** - feel free to:
- ✅ **Edit them** to match your team's coding standards
- ✅ **Delete them** if you prefer different approaches
- ✅ **Add your own** rules for other AI tools
- ✅ **Update them** as new iOS APIs become available

### What Makes These Rules Opinionated
- **No ViewModels**: Embraces pure SwiftUI state management patterns
- **Swift 6+ Concurrency**: Enforces modern async/await over legacy patterns
- **Latest APIs**: Recommends iOS 18+ features with optional iOS 26 guidelines
- **Testing First**: Promotes Swift Testing framework over XCTest
- **Performance Focus**: Emphasizes @Observable over @Published for better performance

**Note for AI assistants**: You MUST read the relevant rules files before making changes to ensure consistency with project standards.

## Project Architecture

```
Dime/
├── Dime.xcworkspace/              # Open this file in Xcode
├── Dime.xcodeproj/                # App shell project
├── Dime/                          # App target (minimal)
│   ├── Assets.xcassets/                # App-level assets (icons, colors)
│   ├── DimeApp.swift              # App entry point
│   └── Dime.xctestplan            # Test configuration
├── DimePackage/                   # 🚀 Primary development area
│   ├── Package.swift                   # Package configuration
│   ├── Sources/DimeFeature/       # Your feature code
│   └── Tests/DimeFeatureTests/    # Unit tests
└── DimeUITests/                   # UI automation tests
```

## Key Architecture Points

### Workspace + SPM Structure
- **App Shell**: `Dime/` contains minimal app lifecycle code
- **Feature Code**: `DimePackage/Sources/DimeFeature/` is where most development happens
- **Separation**: Business logic lives in the SPM package, app target just imports and displays it

### Buildable Folders (Xcode 16)
- Files added to the filesystem automatically appear in Xcode
- No need to manually add files to project targets
- Reduces project file conflicts in teams

## Development Notes

### Code Organization
Most development happens in `DimePackage/Sources/DimeFeature/` - organize your code as you prefer.

### Public API Requirements
Types exposed to the app target need `public` access:
```swift
public struct NewView: View {
    public init() {}
    
    public var body: some View {
        // Your view code
    }
}
```

### Adding Dependencies
Edit `DimePackage/Package.swift` to add SPM dependencies:
```swift
dependencies: [
    .package(url: "https://github.com/example/SomePackage", from: "1.0.0")
],
targets: [
    .target(
        name: "DimeFeature",
        dependencies: ["SomePackage"]
    ),
]
```

### Test Structure
- **Unit Tests**: `DimePackage/Tests/DimeFeatureTests/` (Swift Testing framework)
- **UI Tests**: `DimeUITests/` (XCUITest framework)
- **Test Plan**: `Dime.xctestplan` coordinates all tests

## Configuration

### XCConfig Build Settings
Build settings are managed through **XCConfig files** in `Config/`:
- `Config/Shared.xcconfig` - Common settings (bundle ID, versions, deployment target)
- `Config/Debug.xcconfig` - Debug-specific settings  
- `Config/Release.xcconfig` - Release-specific settings
- `Config/Tests.xcconfig` - Test-specific settings

### Entitlements Management
App capabilities are managed through a **declarative entitlements file**:
- `Config/Dime.entitlements` - All app entitlements and capabilities
- AI agents can safely edit this XML file to add HealthKit, CloudKit, Push Notifications, etc.
- No need to modify complex Xcode project files

### Asset Management
- **App-Level Assets**: `Dime/Assets.xcassets/` (app icon, accent color)
- **Feature Assets**: Add `Resources/` folder to SPM package if needed

### SPM Package Resources
To include assets in your feature package:
```swift
.target(
    name: "DimeFeature",
    dependencies: [],
    resources: [.process("Resources")]
)
```

### Generated with XcodeBuildMCP
This project was scaffolded using [XcodeBuildMCP](https://github.com/cameroncooke/XcodeBuildMCP), which provides tools for AI-assisted iOS development workflows.