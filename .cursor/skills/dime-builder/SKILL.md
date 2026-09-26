---
name: dime-builder
description: Build, review, and demo Dime, an accessibility-first bilingual iPhone Duo conversation app. Use for Dime SwiftUI implementation, Duo pose behavior, UI decisions, demo flow, accessibility review, translation-state logic, or hackathon prioritization.
---

# Dime Builder

You are working on **Dime — “Tell me in your language.”**

Dime is a two-sided iPhone Duo conversation experience for two people who do not speak the same language. The hackathon demo centers on an English-speaking college student studying abroad in Santiago, Chile who is about 8 weeks pregnant and needs prenatal care in a Spanish-speaking setting.

## Load these references when relevant

- Product, script, recap, and demo story: `references/PRODUCT_DEMO.md`
- Brand, colors, logo, and screen hierarchy: `references/BRAND_UI.md`
- Accessibility requirements: `references/ACCESSIBILITY.md`
- iPhone Duo implementation guidance: `references/DUO_IMPLEMENTATION.md`
- Build order, testing, and fallback strategy: `references/BUILD_WORKFLOW.md`

Visual reference PNGs and the approved logo are in `assets/`.

## Core product principles

1. **Two people. Two languages. One shared understanding.**
2. Dime translates, restructures, and clarifies communication.
3. Dime does **not** diagnose, recommend treatment, or replace a clinician or qualified interpreter.
4. If meaning is uncertain, **clarify rather than guess**.
5. In healthcare mode, **Request professional interpreter** must remain reachable.
6. The Duo hardware transition is part of the product story:
   - Closed → Prepare
   - Book / partially folded → Converse
   - Fully open → Understand
7. The seeded demo must work even if live AI, networking, transcription, or translation fails.

## Before the official hackathon build window

If the user says the build window has **not started**, use this skill for:
- planning
- architecture
- asset review
- testing strategy
- prompts
- debugging setup
- documentation

Do **not** generate or write Dime application implementation code unless the user explicitly says the official build window has started or that coding is now allowed.

## During the official build window

When the user says building has started:

1. Prioritize a functioning end-to-end seeded demo before live AI.
2. Use SwiftUI.
3. Use native system typography through `.system()` / SF Pro.
4. Use semantic text styles and Dynamic Type.
5. Prefer SF Symbols for interface actions; use the approved Dime logo for branding.
6. Build adaptive layouts. Do not hard-code one Duo screen size.
7. Use safe areas, size classes, container-relative sizing, and Duo reserved-region handling.
8. Evaluate `ArrangementView` for the student/provider two-view conversation.
9. Keep important text and controls clear of the fold and camera reserved regions.
10. Keep controls consistent across poses.
11. Test closed → book pose → fully open before adding polish.
12. Do not add a backend until the complete seeded demo works.

## UI behavior

### Closed
Show the setup flow:
- Topic selection
- Healthcare selected
- Healthcare context
- English → Español
- Start conversation
- Request professional interpreter

### Book / conversation pose
Primary view:
- Student 👩🏾‍🎓
- English

Secondary view:
- Clinician 🧑🏾‍⚕️
- Español

Core actions:
- Clarify
- Repeat
- Request interpreter
- End, if needed

Keep these actions obvious and reachable. Avoid dense navigation.

### Fully open
Expand into the shared bilingual recap:
- “We’re on the same page.”
- What the student shared
- What the clinician said
- Next steps
- I understand / Entiendo

## Accessibility rules

- Actual app typography: SF Pro through SwiftUI `.system()`.
- Static mockups may use Inter only as a visual fallback.
- Support Dynamic Type.
- Use short lines and generous spacing.
- Use near-black `#111111` on warm white `#FAFAF7`.
- Dime lime is `#CFF75E`; use dark text on it, not white text.
- Soft surface: `#F0F0EA`.
- Clarification/caution: `#F4C65B`.
- Do not communicate meaning with color alone.
- Give icon-only controls accessibility labels.
- Avoid critical text at very small sizes.
- Keep English and Spanish equally legible.
- Any people emoji used in demo copy or presentation should use chocolate-brown skin tone, e.g. 👩🏾‍🎓 and 🧑🏾‍⚕️.

## Agent behavior

- Do not redesign the approved Dime logo.
- Do not invent product requirements that conflict with the references.
- Do not invent Apple Duo APIs. If an API is uncertain, verify it against current Apple/Xcode documentation available in the environment.
- Prefer Apple-native components over custom reimplementations when they meet the requirement.
- When making a change, preserve the existing Dime visual system unless the user explicitly asks for a redesign.
- When reviewing code, prioritize:
  1. compile/run correctness
  2. Duo adaptability
  3. accessibility
  4. demo reliability
  5. visual polish
- Keep the demo under 90 seconds.

## Definition of demo-ready

Dime is demo-ready when all of the following work:

- Healthcare can be selected.
- The early-pregnancy context appears.
- Student and clinician views can show the seeded bilingual conversation.
- Clarification state can be triggered.
- Request professional interpreter remains reachable.
- Fully open recap is readable in both English and Spanish.
- Closed, book, and fully open states are visually stable.
- No essential control or text is lost in the fold/reserved region.
- The seeded path works without live AI.
