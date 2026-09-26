import Foundation

enum ConversationSpeaker: Equatable {
    case student
    case clinician
}

struct ConversationTurn: Identifiable, Equatable {
    let id: Int
    let speaker: ConversationSpeaker
    let english: String
    let spanish: String
}

enum SeededScript {
    static let turns: [ConversationTurn] = [
        ConversationTurn(
            id: 1,
            speaker: .student,
            english: "I’m about 8 weeks pregnant, and I’ve been having strong lower abdominal pain. I’m scared and I’m not sure how to explain everything in Spanish.",
            spanish: "Tengo aproximadamente 8 semanas de embarazo y tengo un dolor fuerte en la parte baja del abdomen. Estoy asustada y no sé cómo explicar todo en español."
        ),
        ConversationTurn(
            id: 2,
            speaker: .clinician,
            english: "It’s okay. We’ll go step by step. Are you having any bleeding or dizziness?",
            spanish: "Está bien. Vamos paso a paso. ¿Tienes sangrado o mareos?"
        ),
        ConversationTurn(
            id: 3,
            speaker: .student,
            english: "I’ve had a little spotting and I feel lightheaded, but I haven’t fainted.",
            spanish: "He tenido un poco de manchado y me siento mareada, pero no me he desmayado."
        ),
        ConversationTurn(
            id: 4,
            speaker: .clinician,
            english: "When did the pain start? Is it constant, or does it come and go?",
            spanish: "¿Cuándo comenzó el dolor? ¿Es constante o va y viene?"
        ),
        ConversationTurn(
            id: 5,
            speaker: .student,
            english: "It started about an hour ago. It comes and goes, but it’s getting stronger.",
            spanish: "Empezó hace aproximadamente una hora. Va y viene, pero está aumentando."
        ),
        ConversationTurn(
            id: 6,
            speaker: .clinician,
            english: "We’re going to evaluate you now. I want to check your vital signs and assess the pregnancy. We may also need to do a transvaginal ultrasound.",
            spanish: "Vamos a evaluarte ahora. Quiero revisar tus signos vitales y evaluar el embarazo. También puede ser necesario hacer una ecografía transvaginal."
        ),
        ConversationTurn(
            id: 7,
            speaker: .student,
            english: "Thank you. Can we keep using Dime, and can I get an interpreter if I need one?",
            spanish: "Gracias. ¿Podemos seguir usando Dime y puedo solicitar un intérprete si lo necesito?"
        )
    ]

    static let clarificationTerm = "ecografía transvaginal"
    static let clarificationRequestSpanish = "La estudiante quiere asegurarse de entender. ¿Puede explicar ‘ecografía transvaginal’ con palabras sencillas?"

    static let contextFacts = [
        "About 8 weeks pregnant",
        "Lower abdominal pain",
        "Pain began around one hour ago",
        "Light spotting",
        "Feeling lightheaded"
    ]

    static let sharedEnglish = [
        "About 8 weeks pregnant",
        "Lower abdominal pain for about 1 hour",
        "Light spotting and lightheadedness",
        "Pain comes and goes and is getting stronger"
    ]

    static let sharedSpanish = [
        "Aproximadamente 8 semanas de embarazo",
        "Dolor en la parte baja del abdomen desde hace aproximadamente 1 hora",
        "Manchado leve y sensación de mareo",
        "El dolor va y viene y está aumentando"
    ]

    static let clinicianEnglish = [
        "We’re going to evaluate you now",
        "Vital signs will be checked",
        "The pregnancy will be assessed",
        "A professional interpreter can be requested"
    ]

    static let clinicianSpanish = [
        "Vamos a evaluarte ahora",
        "Revisaremos tus signos vitales",
        "Evaluaremos el embarazo",
        "Puedes solicitar un intérprete profesional"
    ]

    static let demoLabel = "Hackathon demo • Seeded conversation"

    static func recap(revealedCount: Int) -> RecapFacts {
        if revealedCount >= turns.count {
            return RecapFacts(
                sharedEnglish: sharedEnglish,
                sharedSpanish: sharedSpanish,
                clinicianEnglish: clinicianEnglish,
                clinicianSpanish: clinicianSpanish,
                isComplete: true
            )
        }

        var sharedEnglishFacts: [String] = []
        var sharedSpanishFacts: [String] = []
        var clinicianEnglishFacts: [String] = []
        var clinicianSpanishFacts: [String] = []

        if revealedCount >= 1 {
            sharedEnglishFacts.append("About 8 weeks pregnant")
            sharedEnglishFacts.append("Lower abdominal pain")
            sharedSpanishFacts.append("Aproximadamente 8 semanas de embarazo")
            sharedSpanishFacts.append("Dolor en la parte baja del abdomen")
        }
        if revealedCount >= 3 {
            sharedEnglishFacts.append("Light spotting and lightheadedness")
            sharedSpanishFacts.append("Manchado leve y sensación de mareo")
        }
        if revealedCount >= 5 {
            if let pain = sharedEnglishFacts.firstIndex(of: "Lower abdominal pain") {
                sharedEnglishFacts[pain] = "Lower abdominal pain for about 1 hour"
            }
            if let pain = sharedSpanishFacts.firstIndex(of: "Dolor en la parte baja del abdomen") {
                sharedSpanishFacts[pain] = "Dolor en la parte baja del abdomen desde hace aproximadamente 1 hora"
            }
            sharedEnglishFacts.append("Pain comes and goes and is getting stronger")
            sharedSpanishFacts.append("El dolor va y viene y está aumentando")
        }
        if revealedCount >= 6 {
            clinicianEnglishFacts.append(contentsOf: clinicianEnglish.prefix(3))
            clinicianSpanishFacts.append(contentsOf: clinicianSpanish.prefix(3))
        }

        return RecapFacts(
            sharedEnglish: sharedEnglishFacts,
            sharedSpanish: sharedSpanishFacts,
            clinicianEnglish: clinicianEnglishFacts,
            clinicianSpanish: clinicianSpanishFacts,
            isComplete: false
        )
    }
}

struct RecapFacts: Equatable {
    var sharedEnglish: [String]
    var sharedSpanish: [String]
    var clinicianEnglish: [String]
    var clinicianSpanish: [String]
    var isComplete: Bool

    var isEmpty: Bool {
        sharedEnglish.isEmpty
            && sharedSpanish.isEmpty
            && clinicianEnglish.isEmpty
            && clinicianSpanish.isEmpty
    }
}
