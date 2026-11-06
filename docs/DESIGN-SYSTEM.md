# Lumen design system

## Direction

An observatory meets a contemporary library. Content is immediately available beneath an atmospheric, compact editorial introduction. The application keeps familiar persistent search and navigation while using images, restrained rules and deliberately varied sections to create a world of knowledge.

## Colour

The dark system uses deep navy `#0B111B`, surface `#111B27`, elevated `#182331`, warm text `#F1EFE7`, secondary text `#9CA9B9`, signature gold `#D9B774`, turquoise `#88B7B1`, and borders `#283544`. Gold signifies invitations and learning landmarks; turquoise labels related scientific content. Light mode uses warm paper `#F5F2EB`, soft surfaces `#EEEBE3`, ink `#172332`, muted slate `#596674`, dark gold `#8A682C` and teal `#366C65`. All tokens are defined in `globals.css` and are shared by feature styles.

## Type

Instrument Serif is the editorial voice for headings and occasional reflections. DM Sans is the readable interface and body face. System monospace is reserved for restrained indices and scientific metadata. Both packaged families are self-hosted WOFF2 under their SIL Open Font Licenses; no runtime Google Fonts request occurs. Brand vector lettering is original outlined artwork. Page titles scale from approximately 46px mobile to 68px desktop; most explanatory body text uses 12–14px. Fine metadata is deliberately secondary; critical interactions must remain readable and keyboard accessible.

## Composition

The top navigation is 76px desktop and 66px mobile. The sidebar is 220px desktop, icon-only at tablet width, and an explicit modal drawer on mobile. Page content has a maximum width, with generous but bounded margins. Subject grids adapt from three or four columns to two; learning-path cards become horizontal rows before collapsing further. Hairline rules organise content; cards use a small radius rather than exaggerated pill or glass surfaces.

## Assets

All atmosphere comes from original reusable local assets described in ASSET-MANIFEST.md. Empty states explain the current content state and provide a useful next action. Decorative images use empty alternatives; informative images have descriptive alternatives. Images use optimised WebP and are lazy loaded except the home hero. No fabricated video thumbnails or counts are present.

## Interaction

Every navigation destination resolves to a page. Logo returns home. Search supports keyboard submission, suggestions and Cmd/Ctrl K; Escape dismisses transient panels. Selected sidebar and tab states indicate location. Destructive private actions ask for confirmation. Forms report actual server outcomes and maintain loading and error states. Cookie controls apply embed choices; theme and focus preferences persist. Account preferences synchronise from the database after sign-in.

## Motion and accessibility

Short hover transitions provide feedback without delaying navigation. Skeletons mark loading. System reduced-motion preferences and the account setting suppress motion; focus mode reduces decorative content. Visible focus rings, skip navigation, labelled fields, dialog focus management, semantic landmarks and keyboard-operable tabs support accessibility. Automated audits supplement, rather than replace, human testing and an external review before public release.
