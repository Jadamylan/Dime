import SwiftUI

struct DimeLogoHeader: View {
    var body: some View {
        Image("DimeLogo", bundle: .module)
            .resizable()
            .scaledToFit()
            .frame(maxWidth: 220, alignment: .leading)
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityLabel("Dime. Get help in your language.")
    }
}

struct PostureCaption: View {
    let posture: DuoPosture

    var body: some View {
        Text(label)
            .font(.callout)
            .foregroundStyle(DimePalette.ink)
            .accessibilityLabel("Device posture, \(label)")
    }

    private var label: String {
        switch posture {
        case .unknown:
            "Hinge not reported"
        case .closed:
            "Closed — Prepare"
        case .partial:
            "Partially open — Converse"
        case .full:
            "Fully open — Understand"
        }
    }
}

struct DimePrimaryButton: View {
    let title: String
    let systemImage: String?
    let action: () -> Void

    init(_ title: String, systemImage: String? = nil, action: @escaping () -> Void) {
        self.title = title
        self.systemImage = systemImage
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let systemImage {
                    Image(systemName: systemImage)
                }
                Text(title)
                    .font(.headline)
            }
            .frame(maxWidth: .infinity, minHeight: 52)
            .padding(.horizontal, 16)
            .foregroundStyle(DimePalette.cream)
            .background(DimePalette.ink, in: Capsule())
        }
        .buttonStyle(.plain)
    }
}

struct DimeSecondaryButton: View {
    let title: String
    let systemImage: String?
    let action: () -> Void

    init(_ title: String, systemImage: String? = nil, action: @escaping () -> Void) {
        self.title = title
        self.systemImage = systemImage
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let systemImage {
                    Image(systemName: systemImage)
                }
                Text(title)
                    .font(.headline)
            }
            .frame(minHeight: 44)
            .padding(.horizontal, 16)
            .foregroundStyle(DimePalette.ink)
            .background(DimePalette.soft, in: Capsule())
        }
        .buttonStyle(.plain)
    }
}

struct StatusIndicator: View {
    let status: PipelineStatus

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: symbol)
                .accessibilityHidden(true)
            Text(status.title)
                .font(.headline)
        }
        .foregroundStyle(DimePalette.ink)
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(status == .ready ? DimePalette.lime : DimePalette.blue.opacity(0.16), in: Capsule())
        .overlay {
            Capsule().stroke(status == .ready ? Color.clear : DimePalette.blue, lineWidth: 1.5)
        }
        .accessibilityLabel("Seeded demo status, \(status.title)")
    }

    private var symbol: String {
        switch status {
        case .ready: "checkmark.circle"
        case .listening: "mic.fill"
        case .transcribing: "text.quote"
        case .translating: "character.bubble"
        case .repeating: "repeat"
        }
    }
}

struct InterpreterNotice: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Label("Interpreter request simulated", systemImage: "person.wave.2.fill")
                .font(.callout)
            Text("In a production version, Dime would connect this action to the provider’s interpreter workflow.")
                .font(.footnote)
        }
        .foregroundStyle(DimePalette.ink)
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(DimePalette.soft, in: RoundedRectangle(cornerRadius: 14))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Interpreter request simulated. In a production version, Dime would connect this action to the provider’s interpreter workflow.")
    }
}

struct RestartDemoButton: View {
    @Environment(ConversationSession.self) private var session

    var body: some View {
        Button("Restart demo") {
            session.restartDemo()
        }
        .font(.headline)
        .frame(maxWidth: .infinity, minHeight: 44)
        .buttonStyle(.bordered)
        .tint(DimePalette.ink)
        .accessibilityLabel("Restart demo")
        .accessibilityHint("Clears this conversation and returns to topic selection.")
    }
}
