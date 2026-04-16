# Design System Document: The Clinical Precision Framework

## 1. Overview & Creative North Star
**Creative North Star: "The Clinical Architect"**

This design system moves away from the "friendly tech" trope of rounded bubbles and playful pastels. Instead, it adopts the persona of a high-end medical or research publication. We prioritize **Intentional Asymmetry** and **Tonal Depth** to create an environment that feels authoritative, institutional, and intellectually rigorous.

The system is built on a "Paper-on-Glass" philosophy. Layouts should not feel like flat websites; they should feel like curated clinical reports where data is the protagonist. We break the standard grid by allowing typography and imagery to overlap, creating a sense of depth that suggests a sophisticated multi-layered neuropsychological analysis.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the authority of deep oceanic blues, contrasted by the high-energy "Neural Red" for calls to action and critical data points.

### The Palette
*   **Primary (The Institutional Base):** `primary` (#001e40) and `primary_container` (#003366). Use these for high-level navigation and structural anchoring.
*   **Secondary (The Energetic Impulse):** `secondary` (#ad2c00) and `secondary_container` (#d83900). Reserved strictly for momentum—CTAs, active states, and urgent insights.
*   **Tertiary (The Clinical Detail):** `tertiary` (#450008). Used for deep academic accents and sophisticated contrast.

### The "No-Line" Rule
**Borders are forbidden for sectioning.** To define the transition between a sidebar and a content area, or between a header and a body, use color shifts. 
*   **Implementation:** Place a `surface_container_low` (#f3f4f5) element directly against a `surface` (#f8f9fa) background. The 1% shift in value is enough for the human eye to perceive a boundary without the "clutter" of a 1px line.

### Glass & Gradient Rule
To prevent the UI from feeling "heavy," floating modals or high-level navigation overlays must utilize **Glassmorphism**.
*   **Token Usage:** Use `surface` colors at 80% opacity with a `24px` backdrop blur. 
*   **Signature Textures:** Apply a subtle linear gradient from `primary` (#001e40) to `primary_container` (#003366) on large button surfaces or hero sections to mimic the depth of high-end optical lenses.

---

## 3. Typography: The Editorial Scale
We use a dual-typeface system to balance institutional authority with modern readability.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision. It feels "engineered." 
    *   *Usage:* `display-lg` (3.5rem) should be used with tight letter-spacing (-0.02em) to create an editorial, high-end feel.
*   **Title, Body & Labels (Inter):** The workhorse of the system. Inter’s tall x-height ensures clinical legibility even at the smallest `label-sm` (0.6875rem) sizes.
*   **Visual Hierarchy:** Headlines should feel "heavy" compared to the body. Use `headline-lg` in Semi-Bold next to `body-md` in Regular to create a clear cognitive map for the administrator.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often a crutch for poor layout. In this system, we use **Tonal Layering**.

*   **The Layering Principle:** 
    1.  Base: `background` (#f8f9fa)
    2.  Sectioning: `surface_container_low` (#f3f4f5)
    3.  Interactive Cards: `surface_container_lowest` (#ffffff)
*   **Ambient Shadows:** If an element must float (e.g., a diagnostic dropdown), use a shadow color tinted with the primary hue: `rgba(0, 30, 64, 0.06)` with a `32px` blur and `12px` offset. This mimics natural light passing through a clinical setting.
*   **Ghost Borders:** For accessibility in form fields, use `outline_variant` at **20% opacity**. This provides a guide without interrupting the visual flow of the "No-Line" rule.

---

## 5. Components

### Cards & Data Containers
*   **Rule:** Forbid divider lines. Use `surface_container_high` for headers within cards to separate metadata from the body.
*   **Photography:** School environments and neuropsychology imagery should be treated with a subtle desaturation or a `primary` color wash to ensure they feel like part of the tool, not "stock" additions.

### Buttons (The "Pulse" of the System)
*   **Primary:** Solid `primary` with `on_primary` text. Use `md` (0.375rem) corner radius for a sharp, professional edge.
*   **Secondary/Action:** Use `secondary` (#ad2c00) for "Execute" actions. The high contrast against the blue palette draws immediate neural attention.
*   **Tertiary:** Text-only with an underline that appears only on hover, using `primary_fixed_variant`.

### Input Fields
*   **Style:** Minimalist. No background fill—only a bottom "Ghost Border" that transforms into a `2px` solid `primary` line on focus. This mimics the feeling of filling out a physical clinical form.

### Data Visualization Metaphors (Unique Component)
*   Instead of standard bar charts, use "Neural Sparklines"—thin, high-density lines using the `secondary` color to show student progress over time, embedded directly within list items.

---

## 6. Do’s and Don’ts

### Do:
*   **Use White Space as a Tool:** Allow at least `48px` of margin between major institutional sections.
*   **Embrace Asymmetry:** Align text to the left but allow data visualizations to "bleed" off the right edge of a container to suggest an ongoing flow of information.
*   **Use Tonal Shifts:** Always try to solve a grouping problem with a background color change before reaching for a border.

### Don’t:
*   **Don't use 100% Black:** It is too harsh for a professional tool. Use `on_surface` (#191c1d) for all "black" text.
*   **Don't use "Playful" Icons:** Use thin-stroke (1px or 1.5px) icons. Avoid filled icons unless they represent an active state.
*   **Don't Default to Center Alignment:** This is an institutional tool. Left-aligned content conveys the "Standard Operating Procedure" authority required by the educational sector.

### Accessibility Note:
While we utilize subtle tonal shifts, always ensure that the contrast ratio between text (`on_surface`) and background (`surface_container`) meets WCAG AA standards (4.5:1). When in doubt, increase the weight of the font rather than darkening the color.