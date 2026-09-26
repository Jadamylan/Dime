# Dime — iPhone Duo Implementation Guidance

This file describes implementation intent. For exact API signatures, current Apple/Xcode documentation is authoritative.

## Core adaptive model

Do not create unrelated custom layouts for every physical pose.

Preserve one information hierarchy and let the layout adapt:

- Compact / closed: setup and topic selection
- Book / partially folded: student + clinician conversation
- Regular / fully open: bilingual recap with more hierarchy visible

## Prefer native adaptive containers

Evaluate Apple-native SwiftUI containers first.

For the two-sided conversation, `ArrangementView` is the preferred first implementation to investigate because Dime naturally has:
- one primary view
- one secondary view
- a need to adapt around the fold and changing aspect ratios

If `ArrangementView` is unavailable or unsuitable in the actual SDK/environment, fall back to the closest current Apple-native adaptive container rather than inventing an unsupported API.

## Layout rules

- Do not hard-code a specific Duo display width.
- Use container-relative sizing.
- Use size classes.
- Respect safe-area insets.
- Keep critical controls and text out of reserved regions.
- Treat the fold as a natural divider, not a place for content.
- Avoid dramatic movement of controls between poses.
- Preserve the same core actions and state across poses.

## Navigation and controls

Use system navigation/toolbars where practical.

For adaptable toolbar actions:
- use SF Symbols where appropriate
- pair symbols with accessible titles/labels
- prioritize frequent actions
- keep Clarify and Request interpreter easy to reach
- minimize text-heavy chrome

## Dime pose mapping

### Closed
Single-pane setup:
- topic selection
- healthcare context
- language pair
- start conversation

### Book pose
Two-view conversation:
- Student / English
- Clinician / Español

The hinge visually reinforces that these are two sides of one conversation.

### Fully open
Use the added space to reveal:
- shared bilingual recap
- what I shared
- what the clinician said
- next steps
- confirmation in both languages

## Testing

Use Xcode's current Duo simulation/device tooling.

Minimum test sequence:
1. Launch closed.
2. Complete setup.
3. Enter the seeded conversation.
4. Change to book/partially folded pose.
5. Verify both participant views remain legible.
6. Trigger clarification.
7. Confirm interpreter control remains reachable.
8. Fully open.
9. Verify the bilingual recap.
10. Rotate or resize once to catch fixed-layout assumptions.

## Reserved regions

Check:
- fold
- outer camera region
- inner camera region when active
- vertical toolbar/control areas

No primary CTA, transcript text, or critical medical-context copy should be obscured.

## Agent rule

Never invent an Apple Duo class, modifier, environment value, or API signature. If uncertain, inspect current Apple documentation/SDK first.
