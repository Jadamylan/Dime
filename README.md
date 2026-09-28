# Dime

## Tell me in your language.

**Two people. Two languages. One shared understanding.**

Dime is a face-to-face translation experience designed around the iPhone Duo form factor.

The idea came from a simple question:

> If two people are sitting across from each other and do not speak the same language, why are we still designing translation like they should pass one phone back and forth?

With Duo, the fold becomes part of the interface.

- **Closed:** get the conversation ready
- **Book pose:** each person gets their own side
- **Fully open:** come back together around one shared recap

The hackathon MVP focuses on **English ↔ Español communication in a healthcare setting**.

---

## The product idea

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

The phone is not just sitting between the conversation.

It becomes the thing helping the conversation happen.

---

## Why the hardware matters

Dime is not meant to be a standard translation app stretched across two screens.

The interaction changes with the device:

### Closed — prepare
Choose the context, language pair, and input method.

### Book pose — talk face to face
Each person gets an upright view on their own side of the device.

### Fully open — recap together
Both people can review one shared summary of the conversation.

That physical state change is the product thesis.

---

## Why healthcare for the MVP?

Translation is useful everywhere, but healthcare makes the communication problem easy to understand.

The seeded demo centers on a prenatal conversation and includes:

- English ↔ Español dialogue
- clarification moments
- an always-reachable **Request professional interpreter** path
- a shared recap at the end

> **Dime translates the conversation and helps clarify meaning. It does not diagnose or recommend treatment.**

The prototype is not intended to replace a professional medical interpreter.

---

## Product principles

### Conversation first
Two people should feel like they are talking to each other, not separately talking to a translation tool.

### The form factor should earn its place
If the experience works exactly the same on a normal slab phone, then Duo is not being used creatively enough.

### Accessibility belongs in the interface
Readable type, clear orientation, obvious turn-taking, and simple actions matter more than decorative UI.

### Translation is assistance, not authority
Especially in healthcare, boundaries and escalation paths have to be visible.

### Keep the interface calm
The visual system intentionally avoids dense dashboards, gradients, and unnecessary glass effects. The product uses the system typeface and familiar SF Symbols for actions.

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
- **XcodeBuildMCP** for scaffold/build support
- repo-level instructions for AI-assisted development in Cursor / Claude Code / GitHub Copilot

---

## Why I built it

Dime came out of a hackathon challenge around designing specifically for iPhone Duo.

Translation was already an obvious use case. That meant the interesting part was not simply:

**“Can I translate text?”**

It was:

**“What does translation look like when the hardware finally lets both people have a side?”**

That is the product idea I wanted to test.

---

## What’s next

- live speech-to-speech translation
- more language pairs
- larger accessibility controls
- clearer conversation-state cues
- optional modes beyond healthcare
- stronger interpreter-escalation flows
- better recap controls and consent choices

---

Built as a fast product experiment around an emerging form factor — and as a reminder that sometimes the hardware itself gives you the product idea.
