import SwiftUI

struct ConversationView: View {
    @Environment(ConversationSession.self) private var session

    var body: some View {
        VStack(spacing: 0) {
            ProviderPane()
                .rotationEffect(.degrees(180))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            StudentPane()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(DimeScreenBackground())
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    session.requestInterpreter()
                } label: {
                    Label("Request interpreter", systemImage: "person.wave.2")
                }
            }
        }
    }
}

private struct StudentPane: View {
    @Environment(ConversationSession.self) private var session

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            DimeLogoHeader()
            PostureCaption(posture: session.posture)
            Text("Live conversation")
                .font(.headline)
            Text(SeededScript.demoLabel)
                .font(.footnote)
                .foregroundStyle(DimePalette.ink.opacity(0.72))
            StatusIndicator(status: session.pipeline)
            LanguageBadge(title: "YOU", language: "English")
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if session.clarificationOffered && session.clarificationTermRevealed {
                        ClarificationCard()
                    }
                    ForEach(session.visibleTurns) { turn in
                        if turn.speaker == .student {
                            MessageCard(
                                caption: "You said",
                                text: turn.english,
                                tone: .said
                            )
                        } else {
                            MessageCard(
                                caption: "Dime translated",
                                text: turn.english,
                                tone: .translated
                            )
                        }
                    }
                    if session.visibleTurns.isEmpty && !session.clarificationOffered {
                        Text("Speak when you are ready.")
                            .font(.body)
                            .foregroundStyle(DimePalette.ink.opacity(0.72))
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            ConversationControls()
        }
        .padding(16)
    }
}

private struct ProviderPane: View {
    @Environment(ConversationSession.self) private var session

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                DimeLogoHeader()
                StatusIndicator(status: session.pipeline)
                LanguageBadge(title: "CARE PROVIDER", language: "Español")
                Text(SeededScript.demoLabel)
                    .font(.footnote)
                    .foregroundStyle(DimePalette.ink.opacity(0.72))
                if session.clarificationAsked {
                    MessageCard(
                        caption: "Provider sees",
                        text: SeededScript.clarificationRequestSpanish,
                        tone: .said
                    )
                }
                ForEach(session.visibleTurns) { turn in
                    if turn.speaker == .student {
                        MessageCard(
                            caption: "Dime translated",
                            text: turn.spanish,
                            tone: .translated
                        )
                    } else {
                        MessageCard(
                            caption: "Care Provider said",
                            text: turn.spanish,
                            tone: .said
                        )
                    }
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

private struct LanguageBadge: View {
    let title: String
    let language: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.headline)
            Text(language)
                .font(.subheadline)
        }
        .foregroundStyle(DimePalette.blue)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title), \(language)")
    }
}

private enum MessageTone {
    case said
    case translated
}

private struct MessageCard: View {
    let caption: String
    let text: String
    let tone: MessageTone

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(caption)
                .font(.subheadline)
                .foregroundStyle(DimePalette.ink.opacity(0.72))
            Text(text)
                .font(.title3)
                .foregroundStyle(DimePalette.ink)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tone == .translated ? DimePalette.lime : Color.white, in: RoundedRectangle(cornerRadius: 18))
        .overlay {
            RoundedRectangle(cornerRadius: 18)
                .stroke(tone == .translated ? Color.clear : DimePalette.soft, lineWidth: 1)
        }
        .accessibilityElement(children: .combine)
    }
}

private struct ClarificationCard: View {
    @Environment(ConversationSession.self) private var session

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Needs clarification", systemImage: "questionmark.bubble")
                .font(.headline)
                .foregroundStyle(DimePalette.ink)
            Text("The clinician mentioned “\(SeededScript.clarificationTerm).” Rather than guessing what you understand, Dime can ask the clinician to explain the term in plain language.")
                .font(.body)
                .foregroundStyle(DimePalette.ink)
            if session.clarificationAsked {
                Text("Asked the clinician to explain the term in plain language.")
                    .font(.callout)
            } else {
                DimePrimaryButton("Ask them to explain") {
                    session.askForExplanation()
                }
                Button {
                    session.requestInterpreter()
                } label: {
                    Text("Request interpreter")
                        .font(.headline)
                        .frame(minHeight: 44)
                }
                .buttonStyle(.bordered)
                .tint(DimePalette.ink)
            }
            Text("When meaning matters, Dime asks instead of pretending.")
                .font(.callout)
                .foregroundStyle(DimePalette.ink.opacity(0.8))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(DimePalette.gold.opacity(0.45), in: RoundedRectangle(cornerRadius: 18))
        .overlay {
            RoundedRectangle(cornerRadius: 18)
                .stroke(DimePalette.gold, lineWidth: 2)
        }
    }
}

private struct ConversationControls: View {
    @Environment(ConversationSession.self) private var session

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let next = session.nextTurn {
                Text(next.speaker == .student ? "Next: You" : "Next: Care Provider")
                    .font(.callout)
                    .foregroundStyle(DimePalette.ink.opacity(0.72))
                DimePrimaryButton("Speak", systemImage: "mic.fill") {
                    session.speakNext()
                }
                .disabled(session.pipeline.isBusy)
                .accessibilityHint("Plays the next seeded line through listening, transcribing, and translating.")
            } else {
                Text("The seeded conversation is complete. Open the phone fully for the shared recap.")
                    .font(.callout)
            }
            HStack(spacing: 10) {
                DimeSecondaryButton("Clarify", systemImage: "questionmark.bubble") {
                    session.offerClarification()
                }
                .disabled(!session.clarificationTermRevealed)
                .accessibilityLabel("Clarify")
                .accessibilityHint(session.clarificationTermRevealed ? "Asks the clinician to explain the term in plain language." : "Available after the clinician says the term.")
                DimeSecondaryButton("Repeat", systemImage: "repeat") {
                    session.repeatLastTranslation()
                }
                .disabled(session.revealedCount == 0 || session.pipeline.isBusy)
                .accessibilityLabel("Repeat last translation")
            }
            InterpreterButton()
            RestartDemoButton()
            Text("Dime supports communication. It does not diagnose or provide medical advice.")
                .font(.footnote)
                .foregroundStyle(DimePalette.ink.opacity(0.72))
        }
    }
}
