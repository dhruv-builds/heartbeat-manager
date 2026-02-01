

## Cinematic Hero Section Redesign

### Overview
Transform the hero from a side-by-side split layout into a full-width "cinematic" hero where the uploaded image serves as a background/positioned element with text overlaying the faded left portion.

---

### Visual Design Concept

```text
Desktop (lg+):
+------------------------------------------------------------------+
|  [Nav: Logo]                                  [Login] [Get Ext]  |
+------------------------------------------------------------------+
|                                                                  |
|  +-----------------------+  +----------------------------------+ |
|  |                       |  |                                  | |
|  |   Build better.       |  |                                  | |
|  |   Waste nothing.      |  |     [HERO IMAGE]                 | |
|  |                       |  |     Browser mockup with          | |
|  |   Your backlog        |  |     LovaLog extension panel      | |
|  |   sidekick for...     |  |                                  | |
|  |                       |  |     (Product shot on right,      | |
|  |   [CTA Buttons]       |  |      faded on left)              | |
|  |                       |  |                                  | |
|  +-----------------------+  +----------------------------------+ |
|   ^                          ^                                   |
|   |                          |                                   |
|   Dark gradient overlay      Image positioned right              |
|   (left-to-transparent)      to allow text readability           |
|                                                                  |
+------------------------------------------------------------------+

Mobile:
+-------------------------+
|  [Nav]                  |
+-------------------------+
|                         |
|  Build better.          |
|  Waste nothing.         |
|                         |
|  Your backlog sidekick  |
|                         |
|  [CTA Buttons]          |
|                         |
+-------------------------+
|                         |
|  +-------------------+  |
|  |   Hero Image      |  |
|  |   (stacked below) |  |
|  +-------------------+  |
|                         |
+-------------------------+
```

---

### Implementation Details

**1. Copy Asset to Project**
- Source: `user-uploads://Lovalog_-_frame.png`
- Destination: `src/assets/hero-cinematic.png`
- Import as ES6 module for proper bundling

**2. Hero Section Structure (Desktop)**

The hero will use a relative container with:
- Full-width image positioned on the right
- CSS gradient overlay from left (`#0D0D0D` at 0-40%) to transparent (100%)
- Text content absolutely positioned on the left side
- Minimum height to ensure impact (e.g., `min-h-[80vh]`)

```text
<section className="relative min-h-[80vh] overflow-hidden">
  {/* Background Image - positioned right */}
  <div className="absolute inset-0">
    <img 
      src={heroCinematic} 
      className="w-full h-full object-cover object-right"
    />
    {/* Gradient Overlay: dark left, transparent right */}
    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
  </div>
  
  {/* Text Content - left positioned */}
  <div className="relative z-10 max-w-5xl mx-auto px-6 pt-40 pb-24">
    <div className="max-w-xl">
      <h1>Build better. Waste nothing.</h1>
      <p>Your backlog sidekick...</p>
      <CTAs />
    </div>
  </div>
</section>
```

**3. Gradient Overlay Specifications**
- Direction: `bg-gradient-to-r` (left to right)
- Stops:
  - `from-background` (0%): Solid `#0D0D0D`
  - `via-background/80` (~50%): 80% opacity dark
  - `to-transparent` (100%): Fully transparent

This ensures text on the left has a solid dark background while the product shot on the right remains visible.

**4. Mobile Layout**
- Stack text on top, image below
- Image shown in natural aspect ratio (not as background)
- No gradient overlay needed on mobile since they're stacked

---

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/assets/hero-cinematic.png` | Create | Copy uploaded image |
| `src/pages/LandingPage.tsx` | Modify | Replace hero section with cinematic layout |

---

### Technical Changes in LandingPage.tsx

**Import Change:**
```typescript
// Replace this:
import heroMockup from '@/assets/hero-mockup.png';

// With this:
import heroCinematic from '@/assets/hero-cinematic.png';
```

**Hero Section Replacement (lines 115-165):**

Desktop structure:
- `relative min-h-[80vh]` container
- Absolutely positioned image with `object-cover object-right`
- Gradient overlay div: `bg-gradient-to-r from-background via-background/80 to-transparent`
- Text content with `relative z-10` to sit above the image
- Text constrained to `max-w-xl` on the left

Mobile structure:
- Use Tailwind responsive classes
- `lg:absolute` for image positioning on desktop
- `lg:hidden` / `hidden lg:block` for conditional display
- Stack text first, then show image below on mobile

---

### CSS Gradient Specification

The gradient creates a smooth transition:
```text
0%   [#0D0D0D] -----> 40% [#0D0D0D/80] -----> 100% [transparent]
     Solid dark         Semi-transparent        Invisible
     (text area)        (blend zone)            (product visible)
```

This matches the image's natural fade on the left side and ensures perfect blending.

---

### Summary

1. Copy `user-uploads://Lovalog_-_frame.png` to `src/assets/hero-cinematic.png`
2. Restructure hero section to use full-width cinematic layout
3. Position image on right with `object-right` alignment
4. Add left-to-right gradient overlay for text readability
5. Keep text (headline, subhead, CTAs) on the left side
6. On mobile: stack text above image vertically

