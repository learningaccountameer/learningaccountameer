# HYDROBLT Landing

One-page animated landing page featuring a flashing copy sequence, a central lightning strike with thunder (Web Audio), and a prominent "Join the waiting list" form.

## Run locally

```bash
# From repo root
cd /workspace/hydroblt-landing
python3 -m http.server 5173
# Open http://localhost:5173/
```

## Customize copy

Edit the array in `script.js`:

```js
const messages = [
  'Thunder in the background',
  'Recovery',
  'Hydration',
  '20 grams of protein',
  'Packed in one tinny shot'
];
```

The brand title is in `index.html` within `.brand-title`.

## Connect the waitlist form

By default, submissions are stored in `localStorage` and a success message is shown. To connect to your provider:

- Replace the submit handler in `script.js` to call your API (e.g., ConvertKit, Mailchimp, Formspree) via `fetch`.
- Keep the optimistic success state for a snappy UX.

## Accessibility & motion

- Respects `prefers-reduced-motion` by minimizing animations.
- Sound is off by default due to browser policies; users can enable it with the Sound toggle or first click on the hero.

## Notes

- Thunder is synthesized via Web Audio so no external assets are required.
- The lightning bolt is an SVG path drawn with a stroke-dash animation and a brief flash overlay.