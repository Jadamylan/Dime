import SwiftUI

enum DuoPosture: Equatable {
    case unknown
    case closed
    case partial
    case full

    init(hinge: DeviceHinge?) {
        guard let hinge else {
            self = .unknown
            return
        }
        if hinge.status == .closed {
            self = .closed
        } else if hinge.status == .partiallyOpen {
            self = .partial
        } else if hinge.status == .fullyOpen {
            self = .full
        } else {
            self = .unknown
        }
    }

    var title: String {
        switch self {
        case .unknown:
            "Hinge not reported"
        case .closed:
            "Closed"
        case .partial:
            "Partially open"
        case .full:
            "Fully open"
        }
    }
}

enum PrepareStep: Equatable {
    case topics
    case context
}

enum PipelineStatus: Equatable {
    case ready
    case listening
    case transcribing
    case translating
    case repeating

    var title: String {
        switch self {
        case .ready: "Ready"
        case .listening: "Listening"
        case .transcribing: "Transcribing"
        case .translating: "Translating"
        case .repeating: "Repeating"
        }
    }

    var isBusy: Bool {
        self != .ready
    }
}

enum VisibleExperience: Equatable {
    case topics
    case context
    case conversation
    case recap
}

@MainActor
@Observable
final class ConversationSession {
    var posture: DuoPosture = .unknown
    var prepareStep: PrepareStep = .topics
    var revealedCount = 0
    var pipeline: PipelineStatus = .ready
    var clarificationOffered = false
    var clarificationAsked = false
    var interpreterRequested = false
    var understood = false
    var recapSaved = false
    var manualConversation = false
    private(set) var conversationReady = false
    private(set) var preparedContext = ""
    private var speakGeneration = 0

    var visibleTurns: [ConversationTurn] {
        Array(SeededScript.turns.prefix(revealedCount))
    }

    var recap: RecapFacts {
        SeededScript.recap(revealedCount: revealedCount)
    }

    var clarificationTermRevealed: Bool {
        visibleTurns.contains { $0.spanish.contains(SeededScript.clarificationTerm) }
    }

    var nextTurn: ConversationTurn? {
        guard revealedCount < SeededScript.turns.count else { return nil }
        return SeededScript.turns[revealedCount]
    }

    var experience: VisibleExperience {
        guard conversationReady else {
            return prepareStep == .topics ? .topics : .context
        }
        switch posture {
        case .full:
            return .recap
        case .partial:
            return .conversation
        case .unknown where manualConversation:
            return .conversation
        case .closed, .unknown:
            return .context
        }
    }

    func selectHealthcare() {
        prepareStep = .context
    }

    func noteContext(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        preparedContext = trimmed
    }

    func requestOpenConversation() {
        conversationReady = true
        if posture == .unknown {
            manualConversation = true
        }
    }

    func updateHinge(_ hinge: DeviceHinge?) {
        posture = DuoPosture(hinge: hinge)
        if posture == .partial || posture == .full {
            manualConversation = false
        }
    }

    func speakNext() {
        guard pipeline == .ready, nextTurn != nil else { return }
        speakGeneration += 1
        let generation = speakGeneration
        pipeline = .listening
        Task {
            await advancePipeline(to: .transcribing, generation: generation, after: .milliseconds(700))
            await advancePipeline(to: .translating, generation: generation, after: .milliseconds(700))
            try? await Task.sleep(for: .milliseconds(700))
            guard generation == speakGeneration else { return }
            revealedCount += 1
            if clarificationTermRevealed {
                clarificationOffered = true
            }
            pipeline = .ready
        }
    }

    func repeatLastTranslation() {
        guard pipeline == .ready, revealedCount > 0 else { return }
        speakGeneration += 1
        let generation = speakGeneration
        pipeline = .repeating
        Task {
            try? await Task.sleep(for: .milliseconds(900))
            guard generation == speakGeneration else { return }
            pipeline = .ready
        }
    }

    func offerClarification() {
        guard clarificationTermRevealed else { return }
        clarificationOffered = true
    }

    func askForExplanation() {
        clarificationAsked = true
        clarificationOffered = true
    }

    func requestInterpreter() {
        interpreterRequested = true
    }

    func confirmUnderstanding() {
        understood = true
    }

    func markRecapSaved() {
        recapSaved = true
    }

    func restartDemo() {
        speakGeneration += 1
        prepareStep = .topics
        revealedCount = 0
        pipeline = .ready
        clarificationOffered = false
        clarificationAsked = false
        interpreterRequested = false
        understood = false
        recapSaved = false
        manualConversation = false
        conversationReady = false
        preparedContext = ""
    }

    private func advancePipeline(
        to status: PipelineStatus,
        generation: Int,
        after duration: Duration
    ) async {
        try? await Task.sleep(for: duration)
        guard generation == speakGeneration else { return }
        pipeline = status
    }
}
