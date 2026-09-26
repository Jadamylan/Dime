import RevenueCatUI
import SwiftUI

struct RecapView: View {
    @Environment(ConversationSession.self) private var session
    @Environment(RevenueCatManager.self) private var purchases
    @State private var showPaywall = false

    var body: some View {
        GeometryReader { proxy in
            let divisions = proxy.reservedRegions(kind: .division)
            let hasActiveDivision = divisions.contains { $0.isActive }
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    DimeLogoHeader()
                    PostureCaption(posture: session.posture)
                    Text("We’re on the same page.")
                        .font(.largeTitle)
                        .foregroundStyle(DimePalette.ink)
                    Text("One conversation. Two languages. Shared understanding.")
                        .font(.title3)
                        .foregroundStyle(DimePalette.ink.opacity(0.8))
                    if session.recap.isEmpty {
                        Text("The conversation hasn’t started yet.")
                            .font(.title3)
                            .foregroundStyle(DimePalette.ink)
                        Text("Continue the conversation to build your shared recap.")
                            .font(.body)
                            .foregroundStyle(DimePalette.ink.opacity(0.8))
                    } else {
                        if !session.recap.isComplete {
                            Text("Conversation so far")
                                .font(.headline)
                                .foregroundStyle(DimePalette.ink)
                        }
                        if hasActiveDivision {
                            ArrangementView {
                                EnglishRecapColumn()
                            } secondary: {
                                SpanishRecapColumn()
                            }
                            .arrangementViewStyle(.split)
                            .frame(minHeight: 420)
                        } else {
                            ViewThatFits(in: .horizontal) {
                                HStack(alignment: .top, spacing: 16) {
                                    EnglishRecapColumn()
                                    SpanishRecapColumn()
                                }
                                VStack(alignment: .leading, spacing: 16) {
                                    EnglishRecapColumn()
                                    SpanishRecapColumn()
                                }
                            }
                        }
                        if !session.recap.isComplete {
                            Text("Continue the conversation to complete the recap.")
                                .font(.callout)
                                .foregroundStyle(DimePalette.ink.opacity(0.8))
                        }
                    }
                    if session.recap.isComplete {
                        NextStepCard()
                    }
                    HStack(spacing: 12) {
                        DimePrimaryButton(session.understood ? "Understood" : "I understand") {
                            session.confirmUnderstanding()
                        }
                        .accessibilityLabel("I understand")
                        DimePrimaryButton("Entiendo") {
                            session.confirmUnderstanding()
                        }
                    }
                    SaveRecapButton(
                        saved: session.recapSaved,
                        monthlyPrice: purchases.monthlyPackage?.storeProduct.localizedPriceString ?? "$4.99",
                        message: purchases.errorMessage,
                        save: saveRecap
                    )
                    RestartDemoButton()
                    Text("Dime supports communication. It does not provide medical advice.")
                        .font(.footnote)
                        .foregroundStyle(DimePalette.ink.opacity(0.72))
                }
                .padding(24)
            }
        }
        .background(DimeScreenBackground())
        .sheet(isPresented: $showPaywall, onDismiss: completeSaveIfEntitled) {
            DimeMasPaywall(onUnlocked: {
                session.markRecapSaved()
                showPaywall = false
            })
        }
    }

    private func saveRecap() {
        if purchases.hasDimeMas {
            session.markRecapSaved()
            return
        }
        showPaywall = true
    }

    private func completeSaveIfEntitled() {
        if purchases.hasDimeMas {
            session.markRecapSaved()
        }
    }
}

private struct EnglishRecapColumn: View {
    @Environment(ConversationSession.self) private var session

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("English")
                .font(.subheadline)
                .foregroundStyle(DimePalette.ink.opacity(0.72))
            if !session.recap.sharedEnglish.isEmpty {
                Text("What I shared")
                    .font(.title3)
                FactList(items: session.recap.sharedEnglish)
            }
            if !session.recap.clinicianEnglish.isEmpty {
                Text("What the clinician said")
                    .font(.title3)
                FactList(items: session.recap.clinicianEnglish)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 18))
    }
}

private struct SpanishRecapColumn: View {
    @Environment(ConversationSession.self) private var session

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Español")
                .font(.subheadline)
                .foregroundStyle(DimePalette.ink.opacity(0.72))
            if !session.recap.sharedSpanish.isEmpty {
                Text("Lo que compartí")
                    .font(.title3)
                FactList(items: session.recap.sharedSpanish)
            }
            if !session.recap.clinicianSpanish.isEmpty {
                Text("Lo que dijo el profesional")
                    .font(.title3)
                FactList(items: session.recap.clinicianSpanish)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 18))
    }
}

private struct FactList: View {
    let items: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(items, id: \.self) { item in
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("•")
                        .font(.body)
                        .foregroundStyle(DimePalette.ink)
                        .accessibilityHidden(true)
                    Text(item)
                        .font(.body)
                        .foregroundStyle(DimePalette.ink)
                }
            }
        }
    }
}

private struct NextStepCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Next step / Próximo paso")
                .font(.subheadline)
            Text("Evaluation now • Interpreter available • Keep Dime open during the visit")
                .font(.headline)
        }
        .foregroundStyle(DimePalette.ink)
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(DimePalette.lime, in: RoundedRectangle(cornerRadius: 18))
    }
}

private struct SaveRecapButton: View {
    let saved: Bool
    let monthlyPrice: String
    let message: String?
    let save: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if saved {
                Text("✓ Recap saved with Dime Más")
                    .font(.title3)
                    .foregroundStyle(DimePalette.ink)
                    .accessibilityLabel("Recap saved with Dime Más")
            } else {
                Button(action: save) {
                    Text("Save this recap")
                        .font(.headline)
                        .frame(maxWidth: .infinity, minHeight: 52)
                        .foregroundStyle(DimePalette.cream)
                        .background(DimePalette.plum, in: Capsule())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Save this recap")
                .accessibilityHint("Opens Dime Más so you can save this bilingual recap.")
                Text("Keep your bilingual recap available after the conversation ends.")
                    .font(.body)
                    .foregroundStyle(DimePalette.ink)
                Text("Unlock with Dime Más — \(monthlyPrice)/month")
                    .font(.callout)
                    .foregroundStyle(DimePalette.ink.opacity(0.8))
            }
            if let message, !saved {
                Text(message)
                    .font(.callout)
                    .foregroundStyle(DimePalette.ink)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(DimePalette.plum.opacity(0.12), in: RoundedRectangle(cornerRadius: 18))
        .overlay {
            RoundedRectangle(cornerRadius: 18)
                .stroke(DimePalette.plum, lineWidth: 1.5)
        }
    }
}

private struct DimeMasPaywall: View {
    @Environment(RevenueCatManager.self) private var purchases
    let onUnlocked: () -> Void

    var body: some View {
        Group {
            if let offering = purchases.currentOffering, purchases.monthlyPackage != nil {
                PaywallView(offering: offering, displayCloseButton: true)
                    .onPurchaseCompleted { info in
                        guard purchases.acceptPurchase(info) else { return }
                        Task { await purchases.refresh() }
                        onUnlocked()
                    }
                    .onRestoreCompleted { info in
                        guard purchases.acceptPurchase(info) else { return }
                        Task { await purchases.refresh() }
                        onUnlocked()
                    }
                    .onPurchaseCancelled { }
                    .onPurchaseFailure { error in
                        purchases.recordPurchaseFailure(error)
                    }
            } else {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Dime Más")
                        .font(.largeTitle)
                    Text(purchases.errorMessage ?? "Dime Más isn't available yet.")
                        .font(.body)
                    if purchases.isConfigured {
                        Button("Try again") {
                            Task { await purchases.refresh() }
                        }
                        .font(.headline)
                        .frame(minHeight: 44)
                    }
                }
                .padding(24)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
        }
    }
}
