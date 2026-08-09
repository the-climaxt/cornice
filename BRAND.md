# Cornice — Brand

The product is called **Cornice**. The repository is still named `mountain-events`; only the display name changed.

Source of truth is Tanner's logo sheet. This file exists so a future session doesn't reinvent it. **Do not improvise on the mark.**

---

## The mark

A cornice lip curling over, with confetti chips falling off it. The chips are the "events" half of the idea — they're not decoration, they're the reason the mark works for this product.

Canonical geometry, viewBox `0 0 110 110`:

```svg
<path d="M10 72 C34 72 44 22 70 18 C84 16 88 29 74 34"
      stroke="#F3E7D6" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<rect x="76" y="50" width="10" height="10" rx="2"   fill="#D9563C" transform="rotate(22 81 55)"/>
<rect x="92" y="70" width="8"  height="8"  rx="2"   fill="#E0A040" transform="rotate(-18 96 74)"/>
<rect x="72" y="86" width="7"  height="7"  rx="2"   fill="#C98BA8" transform="rotate(34 75 89)"/>
```

The full lockup uses a fourth chip (teal `#4E9E93`, 7×7 at 72,76). The app icon drops to three.

## Rules

- **No gradients.** Anywhere.
- **Stroke weight is 15/110.** No other weight, except the sub-32px reduction below.
- **Never rotate the curl.**
- **Chips scatter but always stay below the lip.**
- **Clear space:** the height of one confetti chip on all sides of the lockup.
- **Never crop the chips.** They are part of the mark.

### Reduction

| Size | Treatment |
|---|---|
| Full | Curl + 3–4 chips + wordmark |
| Below 32px | One chip, stroke thickened to 19/110 |
| Below 16px | Wordmark comes off entirely |

`docs/favicon.svg` is the reduced form. `docs/icon.svg` is the app icon.

## Palette

| Hex | Name | Use |
|---|---|---|
| `#3F2140` | Plum | Base. App background, icon tile |
| `#D9563C` | Coral | Primary accent, today marker |
| `#E0A040` | Amber | Secondary accent |
| `#4E9E93` | Teal | Tertiary accent, alt icon tile |
| `#C98BA8` | Blush | Quaternary accent, muted highlights |
| `#F3E7D6` | Cream | Paper, text on plum |
| `#FBF7EF` | Cream light | Raised surfaces on cream |
| `#6B5570` | Muted plum | Secondary text |
| `#D6C9B4` | Sand | Hairlines and borders on cream |

The three-bar rule under the wordmark runs Coral 66 / Amber 38 / Teal 20 at 8px tall.

## Type

| Face | Role |
|---|---|
| **Staatliches** | Wordmark and display. Uppercase, letter-spacing `.09em` |
| **DM Mono** | Small labels. Uppercase, letter-spacing `.16em` |
| **Jost** | Body and UI |

Fallbacks: `Staatliches, Impact, sans-serif` · `'DM Mono', ui-monospace, monospace` · `Jost, system-ui, sans-serif`.

All three are open-licensed (OFL) and currently loaded from Google Fonts. **Open item:** self-host the woff2 files in `docs/fonts/` so the PWA renders correctly offline — right now an offline launch falls back to Impact and system-ui. Tracked in `QUESTIONS.md`.

## Header lockup

The sheet specifies the in-app header as the mark, then:

```
CORNICE          (Staatliches, cream)
Next 7 days      (DM Mono, uppercase, tracked, blush)
```
