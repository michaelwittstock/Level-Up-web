# Design rules

Michael wants app polish at the level of Cash App. Default AI design patterns read as cheap to him, and he rejected a mockup for looking "basic". These rules come from the Taste Skill (https://www.tasteskill.dev/, source: github.com/Leonxlnx/taste-skill) and apply to all UI work on this app.

The visual reference for the redesign is the approved v2 tile mockup (`tile-mockup.html`). If it isn't in `docs/reference/`, ask Michael for it before starting the redesign.

## Type

- Satoshi (Fontshare CDN) for text
- JetBrains Mono for all numbers and metadata
- Never Inter, never system fonts alone
- Labels are mono uppercase micro-kickers: 10.5px, letter-spacing .12 to .14em
- Big numbers are mono with tight tracking

## Color

- Never pure black. Use an off-black such as `#0b0b0c`
- One desaturated accent. Level Up v2 uses ember `#e05e3d`
- No purple, no neon glows

## Icons

- No emoji anywhere in the UI
- Custom stroke SVG icons only: stroke width 1.75, round caps

## Layout

- Do not box everything in cards. Use hairline dividers (`border-bottom`) and negative space
- Tiles get hairline borders only
- `min-height: 100dvh`, not `100vh`
- Liquid glass surfaces: `backdrop-filter: blur()` plus a 1px inner top highlight, `inset 0 1px 0 rgba(255,255,255,.06)` to `.08`

## Motion

- Staggered load-in: `animation-delay: calc(var(--i) * 45ms)`
- Easing: `cubic-bezier(.16, 1, .3, 1)`
- Tactile press: `:active { transform: scale(.97) }`
- Animate `transform` and `opacity` only

## Content and states

- Mock data looks real: 47.2%, not 50%
- Every screen needs loading, empty and error states

## Per-area references

Copy the layout and structure of these Mobbin screens, never their colors or branding. The full list with links is in the wiki's Design section and in the Claude Project doc `claude/sprint-1-inventory.md`.

## Where the code stands today

`phase2b-levelup-web/styles/globals.css` is the older "v7 Apple-inspired" look: system fonts, `#000000` background, blue accent `#2e7cf6`, emoji in the tab bar and section titles. It does not follow these rules yet. That gap is the "Design system v2" card on the board; don't fix it piecemeal inside other work.
