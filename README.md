# klean.ph

Klean's website: a static site on GitHub Pages that uses the same Supabase project as the Klean apps.
*Keep it simple. Keep it Klean.*

## What's here
- `pages/` — page bodies (home, find a laundromat, for owners, 404 router, pay-return). `scripts/build.py` wraps
  them in the shared header and footer and writes `<name>.html` at the root.
- Terms, Privacy, FAQ, User Handbook, Super Admin Manual and Hardware Guide are **generated from the app repo's
  `docs/`** (the source of truth). Never edit `terms.html` etc. here.
- `hq/` — **Klean HQ** (laundromat owners' dashboard and machine simulator), copied from the app repo's `hq/`.
- `404.html` + `route.js` — GitHub Pages serves it for unknown paths, so it handles share links: `/m/<token>`
  (machine stickers) and `/b/<id>` (laundromat pages).
- `pay-return.html` — where PayMongo/Stripe send people after paying; it sends them back to the app.
- `.well-known/apple-app-site-association` — lets `/m/*` and `/b/*` links open the iPhone app.
- `.well-known/assetlinks.json` — the same for the Android app (release key fingerprint; add Google Play's app-signing key once on Play).

## Build and preview
```
python3 scripts/build.py            # needs ../klean-app next to this folder
python3 scripts/serve.py            # then open http://localhost:8765 (like GitHub Pages, incl. 404 routing)
```

## Security model
- **No secrets here.** The only key is Supabase's publishable key, which is public by design; the database decides
  what it can read (public facts about live laundromats only).
- **Code comes only from klean.ph.** Libraries are copied into `hq/vendor/`; every page has a Content Security
  Policy allowing scripts and styles from this site and network requests to Klean's Supabase project only.
- **Text from the database is never inserted as HTML** (`el()` in `site.js` uses `textContent`).
- **Never copy anything from the app repo's `bible/` here.** The Bible is private.
