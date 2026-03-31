# Stitching requests: reference images and WhatsApp handoff

## Why this flow exists

WhatsApp deep links (`api.whatsapp.com/send?phone=…&text=…`, same behavior as `wa.me`) can only prefill **text**. They cannot attach images from the browser. Customers must use the attachment (paperclip) control in WhatsApp after opening the chat.

## Step-by-step customer UX

1. **Form — reference image (stitching, upload mode)**  
   Customer picks an image on the device. The site stores the **filename** as a hint for the order summary; the file bytes are not sent to WhatsApp automatically.

2. **Form — submit**  
   Customer taps **Submit order & open WhatsApp**. The order may be POSTed to `/api/orders` (when configured); a tracking URL may be appended to the WhatsApp text.

3. **Pre-redirect modal (critical)**  
   Before leaving the site, a dialog explains:
   - WhatsApp opens with the text summary only.
   - They should tap the **paperclip** and attach reference photo(s) in the same chat, ideally right after sending the prefilled message.

4. **Actions on the modal**  
   - **Open WhatsApp** — navigates to `api.whatsapp.com/send` with the encoded message.  
   - **Back to edit order** — closes the dialog (Escape also closes).  
   - Contextual reminders appear when the order includes upload-based stitching, alteration garment photos, or catalog/describe stitching (optional extra angles).

5. **In WhatsApp**  
   Customer sends the prefilled message, then attaches image(s). The message text reinforces that reference images are (or will be) in the chat and reminds that the website could not attach files automatically.

## UI copy (English)

| Location | Key / purpose |
|----------|----------------|
| Page intro | `requestCopy.pageIntro` — mentions next step + WhatsApp limitation |
| File hint | `requestCopy.fileHintStitching` — filename only on site; attach in WA |
| Modal title | `requestCopy.handoffTitle` |
| Modal body | `requestCopy.handoffLead`, `requestCopy.handoffAttachBold` |
| Conditional | `handoffUploadExtra`, `handoffAlterationExtra`, `handoffCatalogExtra` |
| Buttons | `handoffOpenWhatsapp`, `handoffBackToForm` |

Source: `src/lib/request-copy.ts`.

## WhatsApp message shape

Built by `buildMultiItemOrderMessage` in `src/lib/order/whatsapp.ts`. It includes:

- Prefilled bodies use ASCII-friendly punctuation (e.g. `Hi :)`, `[Priority]`). Avoid emoji in the `text=` query; many clients mishandle supplementary-plane characters and show U+FFFD () instead.
- A line that references attached / following images honestly (with a short clarification that photos follow the text-only deep link).
- Customer block (name, phone, request date).
- `Total items`, `Order reference`, then per-item blocks (stitching or alteration) with design summary, notes, preferred delivery date.
- Closing reminder that WA could not pull files from the site; optional **Track my order** URL.

Per-item design lines for uploads use phrasing like “I’m sending this image in chat” plus the saved filename when present.

## Edge cases and mitigations

| Situation | Mitigation |
|-----------|------------|
| Customer opens WA but never attaches a photo | Pre-modal paperclip instruction; message asks them to use photos in chat; staff can reply asking for references. |
| Upload mode but wrong/unclear image | `handoffUploadExtra` nudges them to attach the same or a clearer photo; notes field on form for context. |
| Catalog-only order (no upload) | `handoffCatalogExtra` suggests optional extra angles / fabric shots. |
| Alteration with optional garment filename | `handoffAlterationExtra` if they named a file on the form. |
| API save fails | Submit still shows handoff modal and allows WhatsApp; order may exist only in chat (operational follow-up). |
| Very long message / URL limits | Rare; if needed later, shorten template or move detail to tracking page only. |

## Future scope (architecture)

- **Image URLs in the message**: After backend storage + signed/public URLs, append one line per image URL in `buildMultiItemOrderMessage` (still encourage an attachment for quality and offline viewing).
- **Backend storage**: Persist file uploads server-side, link `order.id` + `item.id` to stored objects; keep client filename as display name.
