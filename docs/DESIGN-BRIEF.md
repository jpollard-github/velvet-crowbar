# Design brief

## Identity and tone

Velvet Crowbar is an editorial dossier crossed with a beautifully typeset
incident report: composed, exact, dry, and quietly forceful. The lever mark is an
abstract diagonal, not office clip art.

## Tokens and typography

- deep ink `#2b1826`
- warm paper `#f5efdf`, deeper paper `#e9dec8`
- oxidized brass `#9b713f`, brighter brass `#c09a62`
- muted rose `#9f5f68`
- editorial system serif: Iowan/Palatino/Georgia
- restrained system monospace: SF Mono/Consolas/Liberation Mono

No runtime font request exists. CSS variables in `src/styles/globals.css` are
authoritative.

## Page and component language

Pages use folios, rules, generous but not empty margins, strong title scale, and
document-like definition lists. Translations receive an ink band and brass type,
not a meme card. Lists resemble a file register rather than a dashboard grid.
The studio is practical: form, rendered paper preview, restrained status labels.

## Responsive and accessible behavior

At 390px, navigation stacks, multi-column document rows become linear, forms and
preview stack, and tables scroll inside their own container rather than widening
the page. Focus is always visible, the skip link works, contrast is deliberate,
and reduced-motion removes smooth scrolling and transitions.

Avoid corporate blue, startup gradients, glassmorphism, neon cyberpunk,
black-and-red hacker styling, velvet textures, card thickets, stock imagery,
fake metrics, and decorative animation.
