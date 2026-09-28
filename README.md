# Dime

## Tell me in your language.

**Dime is a face-to-face translation experience built around iPhone Duo.**

The idea came from a simple question: if two people are sitting across from each other and do not speak the same language, why are we still designing translation like they should pass one phone back and forth?

With Duo, the fold becomes part of the interface.

- **Closed:** get the conversation ready
- **Book pose:** each person gets their own side
- **Fully open:** come back together around one shared recap

The hackathon MVP focuses on **English ↔ Español communication in a healthcare setting**.

---

## The interaction

```text
Person A speaks / types
        ↓
Dime translates the message
        ↓
Person A sees their language upright
Person B sees the translation facing them
        ↓
Person B responds
        ↓
Conversation continues without passing the device
```

The phone is not sitting between the conversation.

It becomes the thing helping the conversation happen.

---

## Why healthcare for the MVP?

Translation is useful everywhere, but healthcare makes the stakes easy to understand.

The seeded demo centers on a prenatal conversation and includes:

- English ↔ Español dialogue
- clarification moments
- an interpreter-request path
- a shared recap at the end

The MVP is not intended to replace a professional medical interpreter. It is a prototype exploring how the Duo form factor can make bilingual, face-to-face communication feel more natural.

---

## Demo flow

### 1. Closed — prepare
Choose **Healthcare**, speak or type the context, choose English ↔ Español, and continue.

### 2. Book pose — talk face to face
Your side stays upright for you. The opposite side is oriented for the person across from you.

### 3. Fully open — recap together
Both people can review one shared summary of the conversation.

Saving the recap is the current **Dime Más** test-store step.

---

## Run the demo

Open `Dime.xcworkspace` in Xcode 27.1, or open the project in Bitrig and choose:

```text
Run on… → iPhone Duo
```

The seeded conversation and core interaction work without a backend.

### RevenueCat test configuration

The Test Store key belongs in:

```text
Config/Secrets.xcconfig
```

That file is git-ignored.

Set:

```text
REVENUECAT_TEST_STORE_API_KEY
```

The app still builds without the key; it is only needed to exercise the test paywall.

---

## Architecture

```text
Dime/
├── Dime.xcworkspace/
├── Dime.xcodeproj/
├── Dime/
│   ├── Assets.xcassets/
│   ├── DimeApp.swift
│   └── Dime.xctestplan
├── DimePackage/
│   ├── Package.swift
│   ├── Sources/DimeFeature/
│   └── Tests/DimeFeatureTests/
├── DimeUITests/
└── Config/
```

The app target is intentionally thin. Most feature work lives in `DimePackage`.

---

## Technical choices

- **Swift / SwiftUI**
- **Swift Package Manager** for feature isolation
- **Swift 6+ concurrency patterns**
- **Swift Testing + XCUITest**
- **RevenueCat Test Store** for the Dime Más prototype
- **AI-assisted development rules** for Cursor / Claude Code / GitHub Copilot
- scaffolded with **XcodeBuildMCP**

---

## Product principles

A few things I wanted Dime to get right:

### Conversation first
The app should not make two people feel like they are separately talking to a translation tool.

### The form factor should matter
If the experience works exactly the same on a normal slab phone, then I am probably not using Duo creatively enough.

### Accessibility is part of the interface
Readable type, clear orientation, and obvious turn-taking matter more than decorative UI.

### Translation is assistance, not authority
Especially in healthcare, the product needs clear boundaries around what it can and cannot replace.

---

## Why I built it

Dime came out of a hackathon challenge around designing specifically for iPhone Duo.

Translation was already an obvious use case — which also meant the interesting part was not simply **“can I translate text?”**

The interesting part was:

**What does translation look like when the hardware finally lets both people have a side?**

That is the product idea I wanted to test.

---

## What’s next

- live speech-to-speech translation
- more language pairs
- larger accessibility controls
- clearer conversation-state cues
- optional domain modes beyond healthcare
- stronger interpreter-escalation flows
- better recap controls and consent choices

---

Built as a fast product experiment around an emerging form factor — and as a reminder that sometimes the hardware itself gives you the product idea.
