# Hero Section - Implementation Guide

## Quick File Reference

### Files Changed: 4 Total

| File | Type | Changes |
|------|------|---------|
| [App.tsx](App.tsx) | Modified | Added HeroSection import, restructured layout for full-width hero |
| [components/HeroSection.tsx](components/HeroSection.tsx) | **NEW** | Complete hero section component with animations |
| [index.css](index.css) | Modified | Added 8 new @keyframes animations |
| [index.html](index.html) | Modified | Extended Tailwind config with animation definitions |

---

## Component Structure

### HeroSection.tsx Layout
```
<div> Hero Container (min-h-screen, dark background)
  ├── Background Layer
  │   ├── SVG Grid Pattern (animated)
  │   ├── Grid Shift Layer (animated)
  │   ├── Floating Particles × 15 (with random positions)
  │   └── Gradient Orbs × 2 (blob animation)
  │
  └── Content Container (relative z-10)
      ├── Grid Layout (md:grid-cols-2)
      │
      ├── LEFT COLUMN: Text Content
      │   ├── Badge: "AI-Powered Code Intelligence"
      │   ├── Main Heading: "Understand Any Codebase..."
      │   ├── Subheading: "AI-powered repository intelligence..."
      │   ├── CTA Buttons × 2
      │   │   ├── Analyze Repository (primary)
      │   │   └── Legacy Archaeologist (secondary)
      │   └── Trust Indicators × 3
      │
      └── RIGHT COLUMN: Graph Preview
          ├── SVG Canvas (400×400)
          │   ├── Connection Lines (pulse animation)
          │   ├── Nodes × 6
          │   │   ├── Normal Nodes: cyan glow
          │   │   └── Changed Node (main.tsx): red glow + ripple
          │   └── Propagation Ripple (emanates from changed node)
          └── Info Box Overlay
              └── "5 files affected across 2 services"
```

---

## Animation Timeline

### Ambient Animations (Continuous)

| Animation | Duration | Elements | Effect |
|-----------|----------|----------|--------|
| `grid-shift` | 30s | SVG grid pattern | Subtle diagonal movement |
| `blob` | 7s | 2 gradient orbs | Flowing, scaling motion |
| `float` | 8-16s (varied) | 15 particles | Upward drift with fade |
| `node-pulse` | 3s | Normal graph nodes | Glow pulsing |
| `node-pulse-fast` | 1.5s | Changed node | Faster pulsing (priority highlight) |
| `ripple-pulse` | 2s | Node outer rings | Expanding/contracting glow |
| `pulse-line` | 2s | Connection lines | Opacity and thickness vary |

### Event-Triggered Animations

| Animation | Trigger | Duration | Effect |
|-----------|---------|----------|--------|
| `propagate-ripple` | Every 4 seconds | 1.2s | Red ripple wave from main.tsx |
| Fade in (text/graph) | Component mount | 0.3-0.5s | Smooth entrance |

---

## Color Palette

### Primary Colors
```
Cyan:       #06b6d4 (rgb(6, 182, 212))
Emerald:    #10b981 (rgb(16, 185, 129))
Blue:       #3b82f6 (rgb(59, 130, 246))
```

### Accent Colors
```
Red (Changed):  #ef4444 (rgb(239, 68, 68))
Orange:         #ea580c (rgb(234, 88, 12))
```

### Background
```
Hero BG:    #0a0e27 (very dark blue)
Dark Mode:  #0d1117 (GitHub-like dark)
```

### Gradients Used
```
Text Gradient:          cyan → emerald → blue
Changed Node Impact:    red → orange
```

---

## Responsive Behavior

### Desktop (≥768px)
- Grid layout: 60% text (left) + 40% graph (right)
- Hero height: Full screen (min-h-screen)
- Font sizes: Heading xl-7xl, subheading 2xl
- Graph SVG: Scaled to fill right column

### Mobile (<768px)
- Grid layout: Single column, stacked
- Content centered and padded
- Font sizes: Heading 5xl, subheading xl
- Graph: Centered below text
- Buttons: Full width, stacked vertically
- Trust indicators: Single column layout

### Tablet (768px - 1024px)
- Mixed layout with adjusted spacing
- Smaller heading (6xl)
- Graph with reduced scaling

---

## Interactive Elements

### Buttons
- **Primary (Analyze Repository)**
  - Gradient: cyan → emerald
  - Dark text
  - Hover: scale 105%, shadow glow
  - Icon: arrow-right with translate animation

- **Secondary (Legacy Archaeologist)**
  - Dark background, emerald border
  - Light text
  - Hover: border glow, shadow effect
  - Icon: arrow-right with translate animation

### Graph Info Box
- Position: Bottom left of graph
- Style: Dark background with blur, border
- Updates: Shows real-time impact stats

---

## Performance Considerations

### Optimizations Applied
✓ GPU-accelerated animations (transform + opacity)
✓ Particles generated once at component mount
✓ No layout thrashing (animations on GPU properties only)
✓ Staggered animation delays to avoid visual clutter
✓ SVG filters and gradients inline (no external assets)

### Browser Requirements
- CSS Grid & Flexbox
- CSS Filter (blur, drop-shadow)
- SVG support
- ES6+ JavaScript
- Tailwind CSS (via CDN)

### Approximate Bundle Impact
- HeroSection.tsx: ~4 KB
- CSS Animations: ~2 KB
- Total: ~6 KB (minified)

---

## Customization Guide

### Change Colors
**File:** `components/HeroSection.tsx` (search and replace)
```typescript
// Change primary colors
from-cyan-400 → from-blue-400        // Cyan group
to-emerald-400 → to-purple-400       // Emerald group

// Change gradient orbs
from-blue-600 → from-indigo-600      // First blob
```

### Adjust Animation Speed
**File:** `index.html` (tailwind config)
```javascript
animation: {
  'blob': 'blob 7s infinite',     // Change 7s to desired duration
  'grid-shift': 'grid-shift 30s...',  // Change 30s for faster/slower
}
```

### Change Ripple Frequency
**File:** `components/HeroSection.tsx`
```typescript
const rippleTimer = setInterval(() => {
  setRippleActive(prev => !prev);
}, 4000);  // Change 4000ms (4s) to desired interval
```

### Modify Graph Layout
**File:** `components/HeroSection.tsx`
```typescript
const graphNodes: GraphNode[] = [
  { id: 1, label: 'main.tsx', x: 50, y: 20, ... },
  // Adjust x, y coordinates (0-100, SVG viewBox units)
  // Add/remove nodes as needed
]
```

---

## Testing Checklist

- [ ] Hero section displays on home page
- [ ] Animations play smoothly (60 FPS)
- [ ] Dark mode toggle works
- [ ] Buttons navigate correctly
- [ ] Graph is visible on desktop
- [ ] Mobile layout stacks properly
- [ ] Text is readable (high contrast)
- [ ] No console errors
- [ ] Animations pause when tab unfocused
- [ ] Particles render without lag

---

## Browser Compatibility

| Browser | Min Version | Status |
|---------|------------|--------|
| Chrome/Edge | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Mobile Chrome | 90+ | ✅ Full support |
| Mobile Safari | 14+ | ✅ Full support |

---

## Related Files (Unchanged)

All these files work with the hero section without modification:
- Header component (sticky at top)
- RepoForm component (appears after mode selection)
- AnalysisReport component (shows after analysis)
- All API calls and analysis logic

---

## Notes

- Hero section is **full-width** (not contained)
- Other pages (About, Blast Radius) remain **containerized**
- Animations are **always running** (ambient effect)
- Theme toggle works **without refreshing** hero
- No external dependencies added (Tailwind + CSS only)


