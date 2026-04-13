# Brand assets (Radha Creations)

All logo files for this project live **inside this repository** under `GarmentServicesProject` — not under other Cursor workspaces.

| File | Purpose |
|------|--------|
| `docs/brand/radha-creations-logo-transparent.png` | **Source archive** — transparent PNG (e.g. remove.bg export). Use this as the canonical design handoff file. |
| `public/images/radha-creations-logo.png` | **Production asset** served by the site (`/images/radha-creations-logo.png`). Keep in sync with the source above (same image or a compressed variant with the same filename). |

When you replace the logo:

1. Overwrite `docs/brand/radha-creations-logo-transparent.png` and `public/images/radha-creations-logo.png`.
2. Set the `<img>` `width` and `height` in `src/components/layout/SiteHeader.tsx` to the new image’s pixel size (prevents layout shift).
