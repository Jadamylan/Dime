import SwiftUI

struct HealthcareContextView: View {
    @Environment(ConversationSession.self) private var session
    @State private var selectedLanguage: DemoLanguage?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                DimeLogoHeader()
                PostureCaption(posture: session.posture)
                Text("Before you begin")
                    .font(.largeTitle)
                    .foregroundStyle(DimePalette.ink)
                Text("A little context helps Dime keep the conversation clear.")
                    .font(.body)
                    .foregroundStyle(DimePalette.ink.opacity(0.72))
                ContextCard()
                if !session.preparedContext.isEmpty {
                    LanguageCard(selected: $selectedLanguage)
                    if session.conversationReady {
                        Text("Open the phone to start the conversation.")
                            .font(.title3)
                            .foregroundStyle(DimePalette.ink)
                    } else if selectedLanguage != nil {
                        DimePrimaryButton("Okay") {
                            session.requestOpenConversation()
                        }
                        .accessibilityHint("Confirms English and Spanish, then asks you to open the phone.")
                    }
                }
                SafetyCard()
                RestartDemoButton()
                InterpreterButton()
            }
            .padding(24)
        }
        .background(DimeScreenBackground())
    }
}

private enum DemoLanguage: String, CaseIterable, Identifiable {
    case spanish = "Español"
    case portuguese = "Português"
    case french = "Français"

    var id: String { rawValue }
}

private struct ContextCard: View {
    @Environment(ConversationSession.self) private var session
    @State private var draft = ""
    @State private var dictation = ContextDictation()

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Healthcare")
                .font(.subheadline)
                .foregroundStyle(DimePalette.ink.opacity(0.72))
            if session.preparedContext.isEmpty {
                HStack(alignment: .center, spacing: 12) {
                    TextField("What do you need help talking about?", text: $draft)
                        .font(.title3)
                        .textFieldStyle(.plain)
                        .submitLabel(.done)
                        .onSubmit { Task { await save() } }
                        .frame(minHeight: 44)
                        .accessibilityLabel("What do you need help talking about?")
                    Button {
                        Task { await dictation.toggle() }
                    } label: {
                        Image(systemName: dictation.isListening ? "mic.fill" : "mic")
                            .font(.title3)
                            .foregroundStyle(DimePalette.ink)
                            .frame(width: 44, height: 44)
                            .background(dictation.isListening ? DimePalette.lime : DimePalette.soft, in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(dictation.isListening ? "Stop speaking" : "Speak your context")
                }
                if dictation.isListening {
                    Text("Listening…")
                        .font(.callout)
                        .foregroundStyle(DimePalette.ink.opacity(0.72))
                }
                if let message = dictation.message {
                    Text(message)
                        .font(.callout)
                        .foregroundStyle(DimePalette.ink)
                }
                Button {
                    Task { await save() }
                } label: {
                    Text("Save")
                        .font(.headline)
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
                .buttonStyle(.bordered)
                .tint(DimePalette.ink)
                .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .accessibilityHint("Saves what you typed or spoke, then you choose a language.")
            } else {
                Text("Okay. Dime will keep the conversation about this.")
                    .font(.body)
                    .foregroundStyle(DimePalette.ink.opacity(0.72))
                Text(session.preparedContext)
                    .font(.title3)
                    .foregroundStyle(DimePalette.ink)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 18))
        .onChange(of: dictation.transcript) { _, transcript in
            guard !transcript.isEmpty else { return }
            draft = transcript
        }
        .onDisappear {
            Task { await dictation.stop() }
        }
    }

    private func save() async {
        await dictation.stop()
        session.noteContext(draft)
    }
}

private struct LanguageCard: View {
    @Binding var selected: DemoLanguage?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Languages")
                .font(.subheadline)
                .foregroundStyle(DimePalette.ink.opacity(0.72))
            ForEach(DemoLanguage.allCases) { language in
                languageRow(language)
            }
            if let selected, selected != .spanish {
                Text("This demonstration continues in English and Spanish.")
                    .font(.callout)
                    .foregroundStyle(DimePalette.ink)
            }
        }
    }

    private func languageRow(_ language: DemoLanguage) -> some View {
        let isSelected = selected == language
        return Button {
            selected = language
        } label: {
            HStack(spacing: 14) {
                Image(systemName: "character.bubble")
                    .font(.title3)
                    .foregroundStyle(DimePalette.ink)
                    .frame(width: 44, height: 44)
                    .background(isSelected ? DimePalette.lime : DimePalette.soft, in: Circle())
                    .accessibilityHidden(true)
                Text("English ↔ \(language.rawValue)")
                    .font(.headline)
                    .foregroundStyle(DimePalette.ink)
                Spacer(minLength: 8)
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.headline)
                        .foregroundStyle(DimePalette.ink)
                        .accessibilityHidden(true)
                }
            }
            .padding(16)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 18))
            .overlay {
                RoundedRectangle(cornerRadius: 18)
                    .stroke(isSelected ? DimePalette.ink : DimePalette.soft, lineWidth: isSelected ? 2 : 1)
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("English and \(language.rawValue)")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

private struct SafetyCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Medical mode")
                .font(.subheadline)
                .foregroundStyle(DimePalette.ink.opacity(0.72))
            Text("Dime supports communication. It does not diagnose or provide medical advice.")
                .font(.body)
                .foregroundStyle(DimePalette.ink)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(DimePalette.soft, in: RoundedRectangle(cornerRadius: 18))
    }
}

struct InterpreterButton: View {
    @Environment(ConversationSession.self) private var session

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button {
                session.requestInterpreter()
            } label: {
                Label("Request professional interpreter", systemImage: "person.wave.2")
                    .font(.headline)
                    .frame(maxWidth: .infinity, minHeight: 44)
            }
            .buttonStyle(.bordered)
            .tint(DimePalette.ink)
            .accessibilityHint("Simulates an interpreter request for this hackathon prototype. Dime does not contact an interpreter.")
            if session.interpreterRequested {
                InterpreterNotice()
            }
        }
    }
}
