import SwiftUI

enum DimePalette {
    static let cream = Color(red: 250 / 255, green: 250 / 255, blue: 247 / 255)
    static let ink = Color(red: 17 / 255, green: 17 / 255, blue: 17 / 255)
    static let lime = Color(red: 207 / 255, green: 247 / 255, blue: 94 / 255)
    static let soft = Color(red: 240 / 255, green: 240 / 255, blue: 234 / 255)
    static let gold = Color(red: 244 / 255, green: 198 / 255, blue: 91 / 255)
    static let blue = Color(red: 38 / 255, green: 70 / 255, blue: 216 / 255)
    static let plum = Color(red: 79 / 255, green: 45 / 255, blue: 127 / 255)
}

struct DimeScreenBackground: View {
    var body: some View {
        DimePalette.cream.ignoresSafeArea()
    }
}
