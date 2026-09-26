import SwiftUI

public struct ContentView: View {
    @State private var session = ConversationSession()

    public init() {}

    public var body: some View {
        NavigationStack {
            experience
                .toolbar(session.experience == .conversation || session.experience == .recap ? .visible : .hidden, for: .navigationBar)
        }
        .environment(session)
        .onHingeChange { _, newContext in
            session.updateHinge(newContext.hinge)
        }
        .tint(DimePalette.ink)
    }

    @ViewBuilder
    private var experience: some View {
        switch session.experience {
        case .topics:
            TopicSelectionView()
        case .context:
            HealthcareContextView()
        case .conversation:
            ConversationView()
        case .recap:
            RecapView()
        }
    }
}
