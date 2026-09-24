Continue editing the existing AIS UTD website.

Do NOT redesign the site from scratch.

I want two focused improvements:

1. Make the company logos in the “WHERE OUR STUDENTS HAVE WORKED” section stand out much more clearly.
2. Add a polished dark/light mode system across the entire website.

────────────────────────────
1. COMPANY LOGOS
────────────────────────────

Keep the company logos inside the rectangular company section that was just created.

The logos currently look too dim and washed out.

Make them significantly more visible and visually prominent.

DESKTOP APPEARANCE

- Increase default logo opacity to approximately 0.8–0.9.
- On hover, increase opacity to 1.
- Increase contrast so every company is immediately recognizable.
- Preserve each company’s actual proportions.
- Do not stretch logos.
- Keep the logos visually balanced even if their source dimensions differ.
- Target approximately 32–44px maximum logo height depending on the logo.
- Give each logo enough horizontal breathing room.

Do NOT make them look disabled or ghosted.

The company section should feel like a credible “companies our students have worked at” showcase.

Use these companies already present in the project:

- Verizon
- Inogen
- Delta Electronics
- Oracle
- Sprouts
- Goldman Sachs
- Bank of America

Do not invent additional companies.

DARK MODE LOGOS

In dark mode:
- Use white, light gray, or appropriately converted monochrome versions.
- Default opacity around 0.82–0.9.
- Hover opacity 1.
- Avoid overly aggressive grayscale that makes logos unreadable.
- Use subtle brightness enhancement if necessary.

LIGHT MODE LOGOS

In light mode:
- Use dark charcoal or original dark logo treatment where possible.
- Do NOT use white logos on a white background.
- Remove screen blending when it causes logos to disappear.
- Ensure every logo remains clearly visible.

ORACLE

The Oracle logo must render properly.

Do not use the unreliable external URL:
https://cdn.simpleicons.org/oracle/ffffff

Use a local SVG or inline SVG version of the Oracle wordmark.

It must work correctly in both dark and light themes.

Dark mode:
light/white Oracle wordmark.

Light mode:
dark Oracle wordmark or brand-appropriate dark treatment.

Do not show a broken image icon.

INTERACTION

Use a subtle hover treatment:
- slight scale, around 1.03–1.05
- opacity to 1
- optional very subtle glow or background highlight
- 180–250ms transition

Do not create large hover animations.

────────────────────────────
2. DARK / LIGHT MODE
────────────────────────────

Add a fully functional theme toggle to the AIS UTD website.

Do not implement this by only changing the body background.

Create a proper global theme system.

THEME ARCHITECTURE

Refactor the repeated hardcoded colors throughout App.tsx and index.css into reusable CSS variables.

Use something similar to:

:root,
[data-theme="dark"] {
  --bg-primary: #101722;
  --bg-secondary: #192436;
  --bg-elevated: #1C2C44;

  --text-primary: #F8F9FC;
  --text-secondary: #A4B0C2;
  --text-muted: #7E8FA5;

  --border-subtle: rgba(255,255,255,0.06);

  --accent: #F8AE35;
  --accent-hover: #FFC04D;
}

[data-theme="light"] {
  --bg-primary: #F7F8FA;
  --bg-secondary: #FFFFFF;
  --bg-elevated: #F0F3F7;

  --text-primary: #111827;
  --text-secondary: #536174;
  --text-muted: #718096;

  --border-subtle: rgba(15,23,42,0.10);

  --accent: #D98A00;
  --accent-hover: #B97300;
}

These values can be adjusted slightly for accessibility and visual polish, but preserve the AIS navy + gold identity.

Replace hardcoded colors throughout the site with these variables where appropriate.

This includes:

- page background
- navigation
- hero
- cards
- page headers
- event cards
- officer cards
- contact page
- company section
- footer
- mobile navigation
- borders
- secondary text
- icons
- hover states

Do not leave major areas stuck permanently in dark mode.

────────────────────────────
THEME TOGGLE
────────────────────────────

Add a theme toggle to the top navigation.

Place it near the “Get Involved” button.

Use:

Dark mode:
sun icon indicating switching to light mode.

Light mode:
moon icon indicating switching to dark mode.

Use an accessible icon button with:
- aria-label
- keyboard focus state
- tooltip/title
- approximately 36–40px square hit area

Make the icon transition subtly when switching themes.

Do not make the toggle visually compete with the Get Involved CTA.

On mobile, include the theme toggle inside or near the mobile navigation controls.

────────────────────────────
THEME BEHAVIOR
────────────────────────────

On initial load:

1. Check localStorage for an existing AIS theme preference.
2. If none exists, use:
   window.matchMedia("(prefers-color-scheme: dark)")
3. Apply the selected theme to:
   document.documentElement.dataset.theme
4. Save manual changes to localStorage.

Example storage key:

ais-theme

The selected theme must persist after refresh.

Avoid a flash of the incorrect theme when possible.

────────────────────────────
LIGHT MODE VISUAL DIRECTION
────────────────────────────

Do NOT make light mode look like a generic white bootstrap website.

Maintain the premium AIS identity.

Use:
- off-white main background
- white cards
- subtle cool-gray surfaces
- charcoal/navy typography
- AIS gold accents
- restrained shadows
- subtle borders

The hero visualization should also adapt.

In light mode:
- network edges should use subtle gray/navy strokes
- gold nodes should remain gold
- labels should become dark enough to read
- card and canvas surfaces should become light

Keep the visual personality of the dark version.

────────────────────────────
NAVIGATION
────────────────────────────

Dark theme nav:
retain the current translucent dark glass treatment.

Light theme nav:
use a translucent off-white / white treatment such as:

rgba(255,255,255,0.82)

with:
backdrop-filter: blur(20px)

and a subtle gray bottom border.

Navigation text must switch appropriately between themes.

The AIS logo itself should remain unchanged.

────────────────────────────
TRANSITIONS
────────────────────────────

When switching themes, smoothly transition:

background-color
color
border-color
box-shadow

Use approximately 200–300ms.

Do NOT animate layout or dimensions during theme switching.

Respect prefers-reduced-motion.

────────────────────────────
IMPORTANT IMPLEMENTATION NOTE
────────────────────────────

The existing code contains many inline hardcoded dark colors such as:

#101722
#192436
#F8F9FC
#A4B0C2

Do not simply add light-mode CSS overrides on top of those.

Refactor the important inline styles to use CSS variables such as:

var(--bg-primary)
var(--bg-secondary)
var(--text-primary)
var(--text-secondary)
var(--border-subtle)
var(--accent)

so that both themes work consistently.

────────────────────────────
FINAL VERIFICATION
────────────────────────────

Before finishing, verify:

- All company logos are clearly visible without hovering.
- Logos become slightly stronger on hover.
- Oracle renders correctly.
- No broken-image icons exist.
- Dark mode looks as polished as the original.
- Light mode looks intentionally designed.
- Every main page supports both themes.
- Navigation supports both themes.
- Mobile navigation supports both themes.
- Theme persists after refresh.
- System theme is respected on first visit.
- Text passes accessible contrast.
- Gold remains the primary AIS accent in both themes.
- No section retains an accidental hardcoded dark background in light mode.