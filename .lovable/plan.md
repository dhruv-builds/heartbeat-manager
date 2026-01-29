

## Landing Page Art Direction Redesign

### Overview
Transform the landing page from a standard SaaS grid layout into a more editorial, design-forward experience with stronger visual hierarchy, generous whitespace, and atmospheric background effects.

---

### Hero Section Redesign

**Layout Change: Side-by-Side Split**

```
Desktop (lg+):
┌─────────────────────────────────────────────────────────┐
│  Logo  |                                        Login   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   [HEADLINE]                    ┌─────────────────┐     │
│   Build better.                 │                 │     │
│   Waste nothing.                │   Hero Image    │     │
│                                 │   (Browser      │     │
│   [SUBHEAD]                     │   Mockup)       │     │
│   Your backlog sidekick...      │                 │     │
│                                 │   drop-shadow   │     │
│   [CTA BUTTONS]                 └─────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘

Mobile:
┌─────────────────────┐
│   [HEADLINE]        │
│   [SUBHEAD]         │
│   [BUTTONS]         │
│                     │
│   ┌───────────────┐ │
│   │  Hero Image   │ │
│   └───────────────┘ │
└─────────────────────┘
```

**Hero Image:**
- Copy `user-uploads://Untitled_design_2.png` to `src/assets/hero-mockup.png`
- Import as ES6 module for proper bundling
- Apply `drop-shadow-2xl` to the image container
- Slightly rotate image (2-3 degrees) for visual interest

---

### Copy Rewrite: Product/Designer Tone

| Section | Before (Corporate SaaS) | After (Designer Tone) |
|---------|------------------------|----------------------|
| **Headline** | "Build Better Lovable Apps. Spend Fewer Credits." | "Build better. Waste nothing." |
| **Subhead** | "The all-in-one Chrome Extension for backlog management, AI prompt engineering, and smart credit monitoring." | "Your backlog sidekick for Lovable. Capture ideas, craft prompts, track credits—all from your browser." |
| **Pain Section Title** | "Stop Wasting Your Lovable Credits" | "The problems we fix" |
| **Pain 1** | "Bad Prompts Burn Budget" | "Vague prompts, wasted credits" |
| **Pain 2** | "Context Switching Kills Flow" | "Ideas lost between projects" |
| **Pain 3** | "Use It or Lose It" | "Credits that expire at midnight" |
| **Features Title** | "Everything You Need to Ship Faster" | "What's inside" |
| **CTA Title** | "Ready to Build Better?" | "Start building smarter" |
| **CTA Text** | "Join thousands of Lovable builders..." | "It's free. It's fast. It works." |

---

### Visual Atmosphere: Grain + Gradient Blobs

**New CSS Utilities to Add:**

1. **Noise/Grain Overlay**
   ```css
   .noise-overlay {
     position: fixed;
     top: 0;
     left: 0;
     width: 100%;
     height: 100%;
     pointer-events: none;
     opacity: 0.03;
     background-image: url("data:image/svg+xml,..."); /* noise pattern */
     z-index: 50;
   }
   ```

2. **Blurred Gradient Blobs (Decorative)**
   ```css
   .gradient-blob {
     position: absolute;
     border-radius: 50%;
     filter: blur(120px);
     opacity: 0.15;
   }
   ```

**Placement:**
- Pink blob: Top-left of hero, offset behind headline
- Purple blob: Center-right, behind hero image
- Orange blob: Bottom sections, subtle accent

---

### Layout Simplification

**Remove Card Grids, Add Breathing Room:**

| Section | Before | After |
|---------|--------|-------|
| Pain Points | 3-column card grid | Vertical stack with large icons, generous spacing (py-24 → py-32) |
| Features | 2x2 card grid | Alternating left-right layout OR simple vertical list with dividers |
| Section spacing | py-20 | py-28 to py-32 |
| Max content width | max-w-6xl | max-w-5xl (tighter, more focused) |

---

### Typography Hierarchy Enhancement

**Changes:**
- Hero headline: `text-5xl lg:text-7xl` with tighter `leading-[1.1]`
- Section headlines: `text-3xl lg:text-5xl`
- Body text: Increase line-height for readability
- Pain point titles: Larger, gradient text for impact
- Feature titles: `text-2xl font-semibold`

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/assets/hero-mockup.png` | **Create** - Copy uploaded image here |
| `src/pages/LandingPage.tsx` | Rewrite hero layout, update copy, restructure sections, add gradient blobs |
| `src/index.css` | Add `.noise-overlay`, `.gradient-blob` utilities |

---

### Technical Details

**Hero Image Implementation:**
```typescript
import heroMockup from '@/assets/hero-mockup.png';

// In JSX:
<div className="relative drop-shadow-2xl">
  <img 
    src={heroMockup} 
    alt="LovaLog Chrome Extension" 
    className="w-full max-w-lg rounded-2xl rotate-2"
  />
</div>
```

**Gradient Blob Implementation:**
```tsx
{/* Decorative blobs */}
<div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-pink rounded-full filter blur-[120px] opacity-15" />
<div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-brand-purple rounded-full filter blur-[150px] opacity-10" />
```

**Background:**
- Keep `#0D0D0D` (already set via `--background: 0 0% 5%` in dark mode)
- Remove `bg-card/50` alternating sections for cleaner look
- Use subtle border separators instead

---

### Summary

1. Copy hero image to `src/assets/hero-mockup.png`
2. Rewrite `LandingPage.tsx` with split hero layout (text left, image right)
3. Update all copy to designer/product tone
4. Add atmospheric gradient blobs and noise texture
5. Simplify card grids into cleaner vertical layouts
6. Increase whitespace and typography scale

