import SwiftUI

struct TopicSelectionView: View {
    @Environment(ConversationSession.self) private var session

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                DimeLogoHeader()
                PostureCaption(posture: session.posture)
                Text("What do you need help with?")
                    .font(.largeTitle)
                    .foregroundStyle(DimePalette.ink)
                Text("Choose a topic so Dime can help both sides of the conversation.")
                    .font(.body)
                    .foregroundStyle(DimePalette.ink.opacity(0.72))
                VStack(spacing: 12) {
                    TopicCard(
                        title: "Healthcare",
                        detail: "Explain symptoms and understand care",
                        systemImage: "cross.case.fill",
                        isSelected: true,
                        action: { session.selectHealthcare() }
                    )
                    InactiveTopicCard(title: "Travel", detail: "Navigate, ask questions, get help", systemImage: "airplane")
                    InactiveTopicCard(title: "Housing", detail: "Rentals, forms and agreements", systemImage: "house.fill")
                    InactiveTopicCard(title: "Education", detail: "School, tutoring and campus support", systemImage: "book.fill")
                    InactiveTopicCard(title: "Work", detail: "Interviews, meetings and workplace help", systemImage: "briefcase.fill")
                }
                DimePrimaryButton("Start with Healthcare") {
                    session.selectHealthcare()
                }
            }
            .padding(24)
        }
        .background(DimeScreenBackground())
    }
}

private struct TopicCard: View {
    let title: String
    let detail: String
    let systemImage: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: systemImage)
                    .font(.title3)
                    .foregroundStyle(DimePalette.ink)
                    .frame(width: 44, height: 44)
                    .background(isSelected ? DimePalette.lime : DimePalette.soft, in: Circle())
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundStyle(DimePalette.ink)
                    Text(detail)
                        .font(.subheadline)
                        .foregroundStyle(DimePalette.ink.opacity(0.72))
                }
                Spacer(minLength: 8)
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.headline)
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
        .accessibilityLabel("\(title), \(detail)")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

private struct InactiveTopicCard: View {
    let title: String
    let detail: String
    let systemImage: String

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: systemImage)
                .font(.title3)
                .foregroundStyle(DimePalette.ink)
                .frame(width: 44, height: 44)
                .background(DimePalette.soft, in: Circle())
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(DimePalette.ink)
                Text(detail)
                    .font(.subheadline)
                    .foregroundStyle(DimePalette.ink.opacity(0.72))
            }
            Spacer(minLength: 8)
        }
        .padding(16)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 18))
        .overlay {
            RoundedRectangle(cornerRadius: 18)
                .stroke(DimePalette.soft, lineWidth: 1)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title). \(detail). Not part of this demonstration.")
    }
}
