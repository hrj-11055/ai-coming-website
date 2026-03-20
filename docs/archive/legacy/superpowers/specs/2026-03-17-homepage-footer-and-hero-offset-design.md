# Homepage Footer And Hero Offset Design

## Goal

Fix the homepage备案信息 so it stays pinned to the bottom edge of the browser window, and move the homepage hero prompt area upward by 30px without changing the right rail.

## Scope

- Homepage only: `index.html`
- Keep备案文字、字号和浅色风格
- Keep the right rail layout unchanged
- Move the prompt expert badge and input box upward together

## Design

### Footer

Convert the homepage footer into a homepage-specific fixed bottom bar. It should stay visually light, span the viewport width, and sit above the background without reintroducing the shared dark footer treatment.

### Hero Prompt Area

Reduce the homepage hero top spacing by 30px on desktop by adjusting the shared wrapper that contains the prompt expert badge and input box. Preserve the current relative spacing between the badge and the box so they move as a single unit.

### Safety

Add a small bottom padding to the page so the fixed footer does not visually collide with low content states or future content inserted near the end of the page.
