# Dime — Saturday Build Spec

**Tagline:** Tell me in your language.

**Demo setting:** Santiago, Chile. An English-speaking college student studying abroad is about 8 weeks pregnant and needs urgent prenatal care. She can handle everyday Spanish, but not the medical language she needs in a stressful moment.

## Product thesis
Two people. Two languages. One shared understanding.

Dime is a two-sided conversation interface for moments when being understood matters most. It supports communication; it does not diagnose, recommend treatment, or replace a professional interpreter.

## Visual system
- Primary background: warm white `#FAFAF7`
- Primary text: near-black `#111111`
- Accent: Dime lime `#CFF75E`
- Soft surface: `#F0F0EA`
- Caution/clarification: warm gold `#F4C65B`
- **In-app typography: SF Pro via SwiftUI `.system()`**. Use semantic text styles and support Dynamic Type; do not hard-code the core interface to a single point size.
- **Static mockup fallback: Inter**. The PNGs are visual references only; the shipped app should use the system font.
- Large type, short lines, generous spacing, high contrast.
- Use near-black text on Dime lime. Do **not** use white text on lime; the contrast is too low.
- No gradients, glassmorphism, decorative medical imagery, or dense dashboards.
- Any people emoji used in the presentation/copy should use chocolate-brown skin tone (examples: 👩🏾‍🎓, 🧑🏾‍⚕️).


## Apple-native accessibility + Duo implementation notes

- Use **SwiftUI `.system()`** so iOS renders SF Pro and respects system text behavior.
- Prefer semantic text styles (`.title`, `.headline`, `.body`, `.callout`) over fixed font sizes; support Dynamic Type.
- Use **SF Symbols** for interface actions such as microphone, repeat, clarification, interpreter, check, and close. Keep the custom Dime logo for branding.
- Give every icon-only control an accessibility label and do not rely on color alone to communicate selected, warning, or translated states.
- Build the interface to **resize**, using size classes, safe areas, and container-relative layout rather than fixed Duo dimensions.
- Use **`ArrangementView`** for the student/provider two-view conversation where possible.
- Keep critical text and controls away from the fold/camera **reserved regions**.
- Preserve the same information hierarchy across poses: closed = setup, book pose = conversation, fully open = shared recap.
- Test the three demo poses in **Device Hub** before polishing animations.
- Keep core actions reachable in every pose. In medical mode, **Request professional interpreter** must never disappear.
- For toolbar actions, use both a symbol and title so the system can adapt them for horizontal, vertical, and overflow presentation.

## Demo flow

### Screen 1 — Topic selection
**Heading:** What do you need help with?

**Support copy:** Choose a topic so Dime can help both sides of the conversation.

Cards:
1. Healthcare — *selected*
2. Travel
3. Housing
4. Education
5. Work

CTA: **Start with Healthcare**

### Screen 2 — Healthcare context
Location label: **Santiago, Chile**

Heading: **Before you start**

Prompt: **What do you need help saying?**

Student context:
> I’m about 8 weeks pregnant and I’m having lower abdominal pain. I need help explaining what I’m feeling.

Languages: **English → Español**

Medical-mode copy:
> Dime translates the conversation and helps clarify meaning. It does not diagnose or recommend treatment.

CTA: **Start conversation**

Persistent option: **Request professional interpreter**

## Seven-line demo dialogue

**1 — Student 👩🏾‍🎓 (English)**  
“I’m about 8 weeks pregnant, and I’ve been having strong lower abdominal pain. I’m scared and I’m not sure how to explain everything in Spanish.”

**Provider sees (Spanish):**  
“Tengo aproximadamente 8 semanas de embarazo y tengo un dolor fuerte en la parte baja del abdomen. Estoy asustada y no sé cómo explicar todo en español.”

**2 — Clinician 🧑🏾‍⚕️ (Spanish)**  
“Está bien. Vamos paso a paso. ¿Tienes sangrado o mareos?”

**Student sees (English):**  
“It’s okay. We’ll go step by step. Are you having any bleeding or dizziness?”

**3 — Student 👩🏾‍🎓**  
“I’ve had a little spotting and I feel lightheaded, but I haven’t fainted.”

**4 — Clinician 🧑🏾‍⚕️**  
“¿Cuándo comenzó el dolor? ¿Es constante o va y viene?”

**Student sees:**  
“When did the pain start? Is it constant, or does it come and go?”

**5 — Student 👩🏾‍🎓**  
“It started about an hour ago. It comes and goes, but it’s getting stronger.”

**6 — Clinician 🧑🏾‍⚕️**  
“Vamos a evaluarte ahora. Quiero revisar tus signos vitales y evaluar el embarazo.”

**Student sees:**  
“We’re going to evaluate you now. I want to check your vital signs and assess the pregnancy.”

**7 — Student 👩🏾‍🎓**  
“Thank you. Can we keep using Dime, and can I get an interpreter if I need one?”

## Clarification state
Use one short moment to prove Dime does not blindly translate unfamiliar medical language.

Clinician term shown: **“ecografía transvaginal”**

Student card:
> **Needs clarification**  
> The clinician mentioned “ecografía transvaginal.” Rather than guessing what you understand, Dime can ask the clinician to explain the term in plain language.

CTA: **Ask them to explain**

Provider receives:
> “La estudiante quiere asegurarse de entender. ¿Puede explicar ‘ecografía transvaginal’ con palabras sencillas?”

Principle line: **When meaning matters, Dime asks instead of pretending.**

## Fully open recap
Heading: **We’re on the same page.**

### English — What I shared
- About 8 weeks pregnant
- Lower abdominal pain for about 1 hour
- Light spotting + lightheadedness
- Pain comes and goes and is getting stronger

### Español — Lo que compartí
- Aproximadamente 8 semanas de embarazo
- Dolor en la parte baja del abdomen desde hace aproximadamente 1 hora
- Manchado leve + sensación de mareo
- El dolor va y viene y está aumentando

### What the clinician said / Lo que dijo el profesional
- We’re going to evaluate you now / Vamos a evaluarte ahora
- Vital signs will be checked / Revisaremos tus signos vitales
- The pregnancy will be assessed / Evaluaremos el embarazo
- A professional interpreter can be requested / Puedes solicitar un intérprete profesional

### Next step / Próximo paso
**Evaluation now • Interpreter available • Keep Dime open during the visit**

Confirmation buttons:
- **I understand**
- **Entiendo**

Footer:
> Dime supports communication. It does not provide medical advice.

## Judge-facing story
> “I studied abroad and had to seek prenatal care without fully knowing the language. Dime is the tool I wish I had when being understood mattered most.”

Close with:
**Dime turns iPhone Duo into the person between two people who don’t speak the same language.**

## Saturday implementation order
1. Build topic-selection screen.
2. Build healthcare context screen.
3. Build `StudentConversationView` and `ProviderConversationView`.
4. Place them in **`ArrangementView`** and get the book-pose split working.
5. Seed the seven-line dialogue so the full demo works even if live AI is slow.
6. Build the fully-open recap and keep content clear of the fold/reserved regions.
7. Add the clarification state.
8. Test closed → book pose → fully open in **Device Hub**.
9. Only after the core demo works: live transcription/translation, animation, persistence, share/export.

## Do not forget
- Use the already-approved Dime logo asset instead of recreating it.
- Make **Request professional interpreter** reachable throughout medical mode.
- Include a visible listening/thinking/translated state so the audience understands what Dime is doing.
- Have a seeded fallback for every live AI moment.
- Keep the demo under 90 seconds.
