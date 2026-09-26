# Dime — Hackathon Build Workflow

## Goal

Protect the end-to-end demo first. Add live intelligence second.

## Build order

1. Create the SwiftUI project.
2. Add approved Dime logo and palette.
3. Build Topic Selection.
4. Build Healthcare Context.
5. Create shared conversation/session state.
6. Build StudentConversationView.
7. Build ProviderConversationView.
8. Get the two-view Duo conversation adapting correctly.
9. Seed the complete seven-line conversation.
10. Add clarification state.
11. Build the fully-open bilingual recap.
12. Test closed → book pose → fully open.
13. Verify accessibility basics.
14. Only then add live transcription, translation, network services, persistence, or animation.

## Hard priority rule

Do not start backend infrastructure until the seeded demo is complete and stable.

## Seeded fallback

Every live feature must have a fallback.

If live speech/translation fails, the demo must still show:
- English student line
- Spanish provider translation
- Spanish clinician line
- English student translation
- clarification
- recap

## Suggested state model

Keep one source of truth for:
- selected topic
- source language
- target language
- conversation step
- current participant
- transcript
- translated transcript
- clarification state
- interpreter-request state
- recap content

Do not duplicate independent state across student and clinician views.

## Review checkpoints

### Checkpoint 1
Topic selection + healthcare setup work.

### Checkpoint 2
Both conversation views render from the same seeded session state.

### Checkpoint 3
Pose transition does not lose state.

### Checkpoint 4
Clarification and interpreter controls work.

### Checkpoint 5
Fully-open recap renders complete bilingual content.

### Checkpoint 6
Run accessibility checklist.

### Checkpoint 7
Practice the demo under 90 seconds.

## Demo-first debugging priority

Fix in this order:

1. Crash / build failure
2. Broken navigation
3. Lost conversation state
4. Broken Duo layout / fold overlap
5. Illegible text
6. Clarification / interpreter control
7. Recap
8. Live AI
9. Animation
10. Nice-to-have polish

## Medical communication boundary

Dime may:
- translate
- summarize
- restructure questions
- surface uncertainty
- request explanation
- offer a professional-interpreter path

Dime must not:
- diagnose
- recommend treatment
- make clinical decisions
- imply professional interpretation is unnecessary
