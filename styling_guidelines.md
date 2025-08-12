Here’s your **Abundance – Prototype V0 Styling Guidelines** rewritten in **Markdown**:

---

# Styling Guidelines for **Abundance – Prototype V0**

## Core Principles

### 1. **Global CSS First**

* All typography, colors, and base styling **must** come from **global CSS variables and classes**.
* Component-specific CSS should **only** handle **layout and unique component structure**.
* **Never** use inline styles for static styling.

### 2. **Two-Tier CSS Architecture**

* **Public Application**: Uses `src/index.css` with **Inter** font (weights: Semi Bold and Regular).
* **Admin / Builder Panel**: Uses the same Inter-based system for consistency.
* Components automatically get the correct font and color variables from global classes.

### 3. **No Inline Styles Policy**

* **Forbidden**: Static inline styles for fonts, colors, spacing, layout.
* **Allowed**: Dynamic values (CSS custom properties, transforms, animations).
* **Allowed**: Functional requirements (e.g., hidden file inputs).

---

## Color System

Only use these predefined global variables (from your provided palette):

| Token Name           | Hex Value               | Usage                        |
| -------------------- | ----------------------- | ---------------------------- |
| `--color-primary`    | `#171717`               | Primary text & icons         |
| `--color-primary-60` | `rgba(23, 23, 23, 0.6)` | Muted text, disabled states  |
| `--color-primary-70` | `rgba(23, 23, 23, 0.7)` | Secondary emphasis           |
| `--color-secondary`  | `#D7AC00`               | Accent buttons, highlights   |
| `--color-stroke-y`   | `#F6EBBF`               | Decorative yellow strokes    |
| `--color-stroke-g`   | `#F1F1F1`               | Neutral strokes & borders    |
| `--bg-default`       | `#FFFEFA`               | Default background           |
| `--bg-container`     | `#FFFBF2`               | Card/container background    |
| `--text-bg`          | `#F7F4EE`               | Background for text emphasis |

**Rule:** No hardcoded colors in components — always reference CSS variables.

---

## Typography System

**Font:** `Inter`
**Weights:** Semi Bold (SB), Regular (R)
**Sizes:**

* `SB-16` → 16px Semi Bold
* `R-16` → 16px Regular
* `SB-14` → 14px Semi Bold
* `R-14` → 14px Regular
* `SB-12` → 12px Semi Bold
* `R-12` → 12px Regular

**Global class naming convention:**

```css
.text-sb-16 { font-family: Inter; font-weight: 600; font-size: 16px; }
.text-r-16  { font-family: Inter; font-weight: 400; font-size: 16px; }
.text-sb-14 { font-family: Inter; font-weight: 600; font-size: 14px; }
.text-r-14  { font-family: Inter; font-weight: 400; font-size: 14px; }
.text-sb-12 { font-family: Inter; font-weight: 600; font-size: 12px; }
.text-r-12  { font-family: Inter; font-weight: 400; font-size: 12px; }
```

**Rules:**

* Always use a predefined typography class.
* No font properties in component CSS.
* Match Figma typography exactly.

---

## Tech Stack

* **Framework**: React 18 + TypeScript
* **Styling**: CSS files (no CSS-in-JS or styled-components)
* **Routing**: React Router
* **Build Tool**: Vite
* **UI Components**: Custom, Tailwind-inspired utility classes
* **State Management**: React Context
* **Backend**: Supabase (data + auth)
* **Deployment**: Vercel
* **Content**: Dynamically loaded from backend — no placeholder Figma text.

---

#### **Figma to Code Workflow**

**Step 1: Analyze Figma Selection**
```bash
# Get current Figma selection details
mcp__figma-dev-mode-mcp-server__get_code
mcp__figma-dev-mode-mcp-server__get_image
```

**Step 2: Map to Global Classes**
```tsx
// ✅ Good - Use global typography classes
<h1 className="text-sb-14 text-white letter-spacing-wide">
// ❌ Bad - Don't create new font classes for existing fonts
<h1 className="custom-title-font">
```

**Step 3: Component CSS for Layout Only**
```css
/* ✅ Good - Layout extracted from Figma */
.figma-component-web {
  flex: 0 0 820px;  /* From Figma: flex="0 0 820px" */
  gap: 50px;        /* From Figma: gap-[50px] */
  min-width: 215.5px; /* From Figma: min-w-[215.5px] */
}

/* ❌ Bad - Don't add typography to component CSS */
.figma-component-web h1 {
  font-family: 'Inter';
  font-size: 40px;
}
```

When creating new components:

1. Use **global typography** and **color classes**.
2. Create **component-specific CSS** for **layout only**.
3. Never add font, color, or text styling to component CSS.

**Example (✅ Good):**

```tsx
<div className="card-container">
  <h2 className="text-sb-16 text-primary">Card Title</h2>
  <p className="text-r-14 text-primary-70">Card content</p>
</div>
```

```css
.card-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background-color: var(--bg-container);
  border-radius: 8px;
  border: 1px solid var(--color-stroke-g);
}
```

---

## ❌ Avoid These Patterns

```tsx
// Bad: Inline font styles
<h2 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'Inter' }}>Title</h2>

// Bad: Component CSS with typography
.card-title {
  font-family: Inter;
  font-weight: 600;
  font-size: 16px;
}
```

---

## Figma Integration Rules

1. **Extract exact values from Figma** (widths, paddings, gaps, breakpoints).
2. **Follow Figma breakpoints exactly** — no custom breakpoints.
3. **Preserve flex/grid behavior** exactly as in design.

**Example:**

```css
/* Mobile default */
.layout-mobile { display: flex; }

/* Desktop from Figma's breakpoint */
@media (min-width: 1440px) {
  .layout-mobile { display: none; }
  .layout-desktop { display: flex; }
}
```

---

## Allowed vs Forbidden Properties in Component CSS

✅ **Allowed**:
`display`, `flex-direction`, `justify-content`, `align-items`,
`gap`, `padding`, `margin`,
`width`, `height`, `max-width`, `min-height`,
`position`, `top`, `left`, `right`, `bottom`,
`border-radius`, `border-width`, `border-style`,
`background-color`, `background-image`,
`transform`, `transition`,
`z-index`, `overflow`,
`object-fit`, `object-position`

❌ **Forbidden**:
`font-family`, `font-size`, `font-weight`, `font-style`,
`color`, `text-color`,
`line-height`, `letter-spacing`,
`text-align`, `text-decoration`,
`text-shadow`, `text-transform`

---

## Testing Before Commit

* Search for `style={` in `.tsx` files (should only be for dynamic values).
* Verify all text uses a global typography class.
* Test responsive breakpoints exactly as per Figma.
* No hardcoded hex colors — use CSS variables.