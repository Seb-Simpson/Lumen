# Lumen asset manifest

All assets are local in `public/assets/` and resolve at `/assets/<filename>`. No remote image links, licensed stock subscriptions, product screenshots, watermarks, or third-party interface images are required.

## Creation and rights

The observatory and twelve subject images were generated specifically for Lumen with the available OpenAI image-generation tool, using original text prompts and no reference images. They are illustrative editorial artwork, not documentary evidence, scientific diagrams, or photographs of a stated real location. “Physics”, for example, is a visual subject cue rather than an accurate apparatus diagram. No third-party attribution is required by a source licence. Generated content rights are subject to the provider’s applicable terms; this manifest does not claim copyright exclusivity.

The brand, wordmark, emblems, frames, illustrations, waveform, stars and textures are original project artwork. The wordmark uses hand-authored vector letter outlines and has no font dependency. UI fonts (DM Sans and Instrument Serif) are separately distributed under the SIL Open Font License through the pinned `@fontsource` packages.

Subject sheets were generated as two 1536×1024 atlases, then cropped without resampling to individual 508×508 assets. The observatory original is 1536×1024. The imagery was visually inspected for crop quality. Additional sizes are intentionally limited to keep the repository compact; browsers should use native lazy loading and correctly specified dimensions. Production delivery can add AVIF/srcset variants.

## Catalogue

| ID | Filename | Usage | Dimensions | Format | Source / creation | Licence / attribution | Theme | Suggested accessibility text | Optimisation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BR-01 | `lumen-symbol.svg` | Compact light-and-open-book brand symbol | 64×56 | SVG | Original Lumen vector paths | Original project artwork | Both | Decorative alongside visible Lumen name; otherwise “Lumen” | 0.4 KB; optimized |
| BR-02 | `lumen-wordmark.svg` | Custom original outlined LUMEN capitals | 205×60 | SVG | Original Lumen vector paths | Original project artwork | Both | Lumen | 0.4 KB; optimized |
| BR-03 | `lumen-logo-light.svg` | Combined original logo for paper backgrounds | 285×60 | SVG | Original Lumen vector paths | Original project artwork | Light | Lumen — home | 0.7 KB; optimized |
| BR-04 | `lumen-logo-dark.svg` | Combined original logo for navy backgrounds | 285×60 | SVG | Original Lumen vector paths | Original project artwork | Dark | Lumen — home | 0.7 KB; optimized |
| BR-05 | `favicon.svg` | Browser favicon | 64×64 | SVG | Original Lumen vector paths | Original project artwork | Both | Decorative: empty alt / aria-hidden | 0.5 KB; optimized |
| BR-06 | `lumen-app-icon.png` | 512px application/install icon | 512×512 | PNG | Original deterministic raster artwork | Original project artwork | Both | Lumen | 3.3 KB; optimized |
| BR-07 | `lumen-watermark.svg` | Subtle brand emblem for selected surfaces | 224×190 | SVG | Original Lumen vector paths | Original project artwork | Dark | Decorative: empty alt / aria-hidden | 0.5 KB; optimized |
| AT-01 | `observatory-hero.webp` | Discovery homepage atmospheric hero | 1536×1024 | WEBP | Original generated observatory artwork | Generated for this project, no external reference | Both | A warmly lit mountain observatory beneath a star-filled night sky | 187.2 KB; optimized |
| AT-02 | `library-atmosphere.webp` | Library and personal-space atmosphere | 508×508 | WEBP | Original generated subject sheet B; optimized crop | Generated for this project, no external reference | Both | Sunlight falls over an open book in a quiet library | 53.3 KB; optimized |
| AT-03 | `cosmic-atmosphere.webp` | Astronomy discovery environment | 508×508 | WEBP | Original generated subject sheet A; optimized crop | Generated for this project, no external reference | Both | A luminous spiral galaxy against a field of stars | 65.7 KB; optimized |
| AT-04 | `paper-grain.webp` | Seamless subtle paper surface texture | 256×256 | WEBP | Original deterministic raster artwork | Original project artwork | Both | Decorative: empty alt / aria-hidden | 2.4 KB; optimized |
| AT-05 | `night-sky-texture.webp` | Restrained repeating celestial texture | 768×512 | WEBP | Original deterministic raster artwork | Original project artwork | Dark | Decorative: empty alt / aria-hidden | 3.9 KB; optimized |
| AT-06 | `constellation-details.svg` | Original constellation linework | 300×220 | SVG | Original Lumen vector paths | Original project artwork | Both | Decorative: empty alt / aria-hidden | 0.6 KB; optimized |
| AT-07 | `scientific-engraving.svg` | Original orbital scientific line illustration | 320×240 | SVG | Original Lumen vector paths | Original project artwork | Both | Decorative: empty alt / aria-hidden | 1.7 KB; optimized |
| AT-08 | `lumen-light-rays.svg` | Fine signature ray motif | 600×280 | SVG | Original Lumen vector paths | Original project artwork | Both | Decorative: empty alt / aria-hidden | 0.6 KB; optimized |
| SB-01 | `astronomy.webp` | Astronomy subject art | 508×508 | WEBP | Original generated subject sheet A; optimized crop | Generated for this project, no external reference | Both | A luminous spiral galaxy and distant stars | 66.5 KB; optimized |
| SB-02 | `physics.webp` | Physics subject art | 508×508 | WEBP | Original generated subject sheet A; optimized crop | Generated for this project, no external reference | Both | Brass wave apparatus and a glass prism in a laboratory | 40.5 KB; optimized |
| SB-03 | `mathematics.webp` | Mathematics subject art | 508×508 | WEBP | Original generated subject sheet A; optimized crop | Generated for this project, no external reference | Both | A sculptural spiral staircase viewed from above | 75.6 KB; optimized |
| SB-04 | `biology.webp` | Biology subject art | 508×508 | WEBP | Original generated subject sheet A; optimized crop | Generated for this project, no external reference | Both | A detailed green fern with water droplets | 71.6 KB; optimized |
| SB-05 | `chemistry.webp` | Chemistry subject art | 508×508 | WEBP | Original generated subject sheet A; optimized crop | Generated for this project, no external reference | Both | Glass laboratory flasks in warm and turquoise light | 55.9 KB; optimized |
| SB-06 | `history.webp` | History subject art | 508×508 | WEBP | Original generated subject sheet A; optimized crop | Generated for this project, no external reference | Both | Ancient stone columns in warm dawn light | 81.0 KB; optimized |
| SB-07 | `computing.webp` | Computing subject art | 508×508 | WEBP | Original generated subject sheet B; optimized crop | Generated for this project, no external reference | Both | Copper circuitry and warm vacuum tubes | 60.2 KB; optimized |
| SB-08 | `economics.webp` | Economics subject art | 508×508 | WEBP | Original generated subject sheet B; optimized crop | Generated for this project, no external reference | Both | A river winds through an architectural city at dusk | 75.0 KB; optimized |
| SB-09 | `literature.webp` | Literature subject art | 508×508 | WEBP | Original generated subject sheet B; optimized crop | Generated for this project, no external reference | Both | An open book on a sunlit library desk | 54.1 KB; optimized |
| SB-10 | `earth-science.webp` | Earth science subject art | 508×508 | WEBP | Original generated subject sheet B; optimized crop | Generated for this project, no external reference | Both | Layered canyon rock and a winding turquoise river | 87.3 KB; optimized |
| SB-11 | `philosophy.webp` | Philosophy subject art | 508×508 | WEBP | Original generated subject sheet B; optimized crop | Generated for this project, no external reference | Both | A classical sculptural head beside an ancient portico | 72.7 KB; optimized |
| SB-12 | `arts.webp` | Creative arts subject art | 508×508 | WEBP | Original generated subject sheet B; optimized crop | Generated for this project, no external reference | Both | Paintbrushes and an oil paint palette in an artist’s studio | 68.9 KB; optimized |
| UI-01 | `lumen-divider.svg` | Fine rule with central diamond detail | 480×24 | SVG | Original Lumen vector paths | Original project artwork | Both | Decorative: empty alt / aria-hidden | 0.2 KB; optimized |
| UI-02 | `editorial-border.svg` | Reusable editorial corner frame | 320×240 | SVG | Original Lumen vector paths | Original project artwork | Both | Decorative: empty alt / aria-hidden | 0.3 KB; optimized |
| UI-03 | `subject-emblems.svg` | Twelve original emblems; SVG symbol IDs match subject slugs | 384×128 | SVG | Original Lumen vector paths | Original project artwork | Both | Use the corresponding subject name when standalone | 6.2 KB; optimized |
| UI-04 | `empty-library.svg` | Original library shelves and open-book illustration | 320×240 | SVG | Original Lumen vector paths | Original project artwork | Both | Decorative: empty alt / aria-hidden | 0.8 KB; optimized |
| UI-05 | `empty-search.svg` | Original lens and geometric specimen illustration | 320×240 | SVG | Original Lumen vector paths | Original project artwork | Both | Decorative: empty alt / aria-hidden | 0.4 KB; optimized |
| UI-06 | `empty-learning-path.svg` | Original journey through connected milestones | 320×240 | SVG | Original Lumen vector paths | Original project artwork | Both | Decorative: empty alt / aria-hidden | 0.5 KB; optimized |
| UI-07 | `default-avatar.svg` | Default Lumen account avatar | 80×80 | SVG | Original Lumen vector paths | Original project artwork | Both | Your account | 0.5 KB; optimized |
| UI-08 | `video-placeholder.svg` | Purposeful unavailable-video poster | 640×360 | SVG | Original Lumen vector paths | Original project artwork | Both | No video is available | 1.1 KB; optimized |
| UI-09 | `podcast-wave.svg` | Original restrained waveform motif | 320×120 | SVG | Original Lumen vector paths | Original project artwork | Both | Decorative: empty alt / aria-hidden | 1.1 KB; optimized |
| UI-10 | `collection-cover.svg` | Branded collection cover template | 400×260 | SVG | Original Lumen vector paths | Original project artwork | Both | Decorative: empty alt / aria-hidden | 0.7 KB; optimized |
| UI-11 | `learning-progress.svg` | Progress styling specimen; actual progress must use real data | 80×80 | SVG | Original Lumen vector paths | Original project artwork | Both | Decorative: empty alt / aria-hidden | 0.4 KB; optimized |
| UI-12 | `auth-environment.webp` | Authentication side illustration | 1536×1024 | WEBP | Original generated observatory artwork; derivative composition | Generated for this project, no external reference | Both | A mountain observatory under a deep blue night sky | 148.3 KB; optimized |
| UI-13 | `share-preview.webp` | Open Graph social preview | 1200×630 | WEBP | Original generated observatory artwork; derivative composition | Generated for this project, no external reference | Both | Lumen — a new home for learning | 80.2 KB; optimized |

## Reuse and accessibility

- Use the light-background logo on warm paper and the dark-background logo on navy. The name in the filename identifies the intended background.
- Atmospheric art, textures, section frames, waves and empty-state illustrations should use empty alt text when accompanying explanatory text. They must not convey state alone.
- Subject cards can use empty alt text if their subject heading is inside the same link, preventing duplicate announcements. Use the supplied descriptions when images stand alone.
- `subject-emblems.svg` provides `<symbol>` IDs for all twelve subject slugs. Set accessible names on the parent SVG if the emblem is informative.
- `learning-progress.svg` is an art-system specimen; it must never imply a user’s progress. Render dynamic progress from persisted completion data in the UI.
- All WebP artwork is optimized locally and contains no tracking pixel or network dependency. PNG is retained only for the app icon. Original generation files remain outside the repository in the execution workspace.
- The catalogue includes reusable assets beyond the currently displayed surfaces so future pages can use the same visual language. No unused asset implies an implemented product feature.
