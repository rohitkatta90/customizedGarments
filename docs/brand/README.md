# Brand assets (Radha Creations)

All logo files for this project live **inside this repository** under `GarmentServicesProject` — not under other Cursor workspaces.

| File | Purpose |
|------|--------|
| `docs/brand/radha-creations-logo-original.png` | **Master archive** — full-resolution export from design / remove.bg. Update this when the logo changes. |
| `public/images/radha-creations-logo.png` | **Production file** served by Next.js (`/images/radha-creations-logo.png`). After changing the master, copy it here (or export a web-optimized PNG with the same filename). |

When you replace the logo:

1. Overwrite `docs/brand/radha-creations-logo-original.png` and `public/images/radha-creations-logo.png`.
2. Set the `<img>` `width` and `height` in `src/components/layout/SiteHeader.tsx` to the new image’s pixel size (prevents layout shift).
