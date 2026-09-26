# Dime — 5-Minute Accessibility Check Before Demo

## Typography
- [ ] App uses SwiftUI `.system()` / SF Pro.
- [ ] Dynamic Type works without clipped text.
- [ ] No critical instruction is tiny or dependent on a custom display font.
- [ ] English and Spanish conversation text remain easy to scan at a glance.

## Color + meaning
- [ ] Near-black text on warm white, soft gray, lime, and gold.
- [ ] No white text on Dime lime.
- [ ] Selection / warning / translated state is communicated by text or icon as well as color.

## Interaction
- [ ] Clarify, Repeat, Request interpreter, and primary CTA are easy to tap.
- [ ] Icon-only controls have accessibility labels.
- [ ] Request professional interpreter remains available throughout medical mode.

## Duo
- [ ] Closed screen resizes cleanly.
- [ ] Book pose keeps student and clinician content on separate sides.
- [ ] No key text or buttons cross the fold/reserved region.
- [ ] Fully open recap displays complete English and Spanish content.
- [ ] Device Hub test completed for closed → book → fully open.

## Demo safety
- [ ] Dime never diagnoses or recommends treatment.
- [ ] Clarification state appears when meaning is uncertain.
- [ ] Seeded fallback works if live transcription/translation is slow.


## Implementation guidance

- Use SwiftUI `.system()` for the actual app UI so the interface uses Apple's system typography.
- Prefer semantic text styles and Dynamic Type rather than fixed type sizes for core content.
- Static PNGs are reference designs, not pixel-perfect implementation specifications.
- Preserve readable line length when the device changes pose.
- Keep the primary action visually obvious without relying only on the Dime lime color.
- For toolbar or symbol-only actions, provide clear accessibility labels.
- Verify English and Spanish text at larger accessibility sizes.
