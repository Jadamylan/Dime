import SwiftUI
import DimeFeature

@main
struct DimeApp: App {
    init() {
        RevenueCatManager.shared.configureIfNeeded()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(RevenueCatManager.shared)
        }
    }
}
