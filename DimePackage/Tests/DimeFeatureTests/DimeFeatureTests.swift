import Testing
@testable import DimeFeature

@Test func seededConversationHasSevenBilingualTurns() {
    #expect(SeededScript.turns.count == 7)
    #expect(SeededScript.turns.allSatisfy { !$0.english.isEmpty && !$0.spanish.isEmpty })
    #expect(SeededScript.turns.map(\.speaker) == [
        .student, .clinician, .student, .clinician, .student, .clinician, .student
    ])
}

@Test @MainActor func fullyOpenBeforeConversationDoesNotExposeFutureRecap() {
    let session = ConversationSession()
    session.posture = .full
    #expect(session.experience == .topics)
    session.requestOpenConversation()
    #expect(session.experience == .recap)
    #expect(session.revealedCount == 0)
    #expect(session.recap.isEmpty)
    let leaked = session.recap.sharedEnglish + session.recap.sharedSpanish + session.recap.clinicianEnglish + session.recap.clinicianSpanish
    #expect(leaked.isEmpty)
    #expect(!session.recap.isComplete)
}

@Test @MainActor func partialConversationRecapOmitsUnrevealedFacts() {
    let session = ConversationSession()
    session.revealedCount = 2
    let recap = session.recap
    #expect(recap.sharedEnglish == [
        "About 8 weeks pregnant",
        "Lower abdominal pain"
    ])
    #expect(!recap.sharedEnglish.joined(separator: " ").contains("1 hour"))
    #expect(!recap.sharedEnglish.joined(separator: " ").localizedCaseInsensitiveContains("spotting"))
    #expect(recap.clinicianEnglish.isEmpty)
    #expect(recap.clinicianSpanish.isEmpty)
    #expect(!recap.isComplete)

    session.revealedCount = SeededScript.turns.count
    #expect(session.recap.isComplete)
    #expect(session.recap.sharedEnglish == SeededScript.sharedEnglish)
    #expect(session.recap.sharedSpanish == SeededScript.sharedSpanish)
    #expect(session.recap.clinicianEnglish == SeededScript.clinicianEnglish)
    #expect(session.recap.clinicianSpanish == SeededScript.clinicianSpanish)
}

@Test @MainActor func launchStartsAtTopicSelectionUntilHealthcareIsChosen() {
    let session = ConversationSession()
    session.posture = .partial
    #expect(session.experience == .topics)

    session.selectHealthcare()
    #expect(session.experience == .context)

    session.requestOpenConversation()
    #expect(session.experience == .conversation)

    session.posture = .full
    #expect(session.experience == .recap)

    session.posture = .closed
    #expect(session.experience == .context)
}

@Test @MainActor func restartDemoReturnsToTopicSelection() {
    let session = ConversationSession()
    session.posture = .partial
    session.selectHealthcare()
    session.requestOpenConversation()
    session.revealedCount = 3
    session.requestInterpreter()
    session.restartDemo()
    #expect(session.experience == .topics)
    #expect(session.revealedCount == 0)
    #expect(session.interpreterRequested == false)
    #expect(session.recap.isEmpty)
}

@Test @MainActor func interpreterRequestStaysLocalAndSimulated() {
    let session = ConversationSession()
    #expect(session.interpreterRequested == false)
    session.requestInterpreter()
    #expect(session.interpreterRequested == true)
    #expect(SeededScript.demoLabel == "Hackathon demo • Seeded conversation")
}

@Test @MainActor func clarificationWaitsForTransvaginalUltrasoundTurn() {
    let session = ConversationSession()
    session.revealedCount = 5
    session.offerClarification()
    #expect(session.clarificationTermRevealed == false)
    #expect(session.clarificationOffered == false)

    session.revealedCount = 6
    let clinicianTurn = session.visibleTurns[5]
    #expect(clinicianTurn.spanish.contains(SeededScript.clarificationTerm))
    #expect(clinicianTurn.english.localizedCaseInsensitiveContains("transvaginal ultrasound"))
    #expect(session.clarificationTermRevealed == true)
    session.offerClarification()
    #expect(session.clarificationOffered == true)
}
