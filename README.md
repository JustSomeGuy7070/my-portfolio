# JustSomeGuy7070 Portfolio

React + Vite portfolio site for JustSomeGuy7070.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm `>=10`

## Local Development

```bash
npm install
npm run dev
```

## Production Check

Run the same validation expected before deployment:

```bash
npm run check
```

This runs ESLint and creates a production build in `dist/`.

## Deployment

The project is ready for static hosting.

### Vercel

- Framework preset: `Vite`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

The included `vercel.json` makes these settings explicit and rewrites all routes to `index.html` for React Router.

### Netlify or Other Static Hosts

- Build command: `npm run build`
- Publish directory: `dist`

The included `public/_redirects` handles React Router fallback routing on Netlify.