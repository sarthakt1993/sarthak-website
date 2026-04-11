# CLAUDE.md — Project Context

## File Structure

```
/
├── index.html                          # Homepage: hero, interests, collage, about, contact
├── .env                                # Notion + Cloudinary secrets
├── package.json                        # Express + Notion SDK + Cloudinary dependencies
│
├── server/
│   ├── server.js                       # Express API server with Notion & Cloudinary endpoints
│   └── setup-notion.js                 # Notion database setup utility
│
├── pages/
│   ├── nyc-food.html                   # Restaurant list/cluster page (Notion-powered)
│   ├── national-parks.html             # Parks tiles/grouped page (Notion-powered)
│   ├── coffee-map.html                 # Coming soon placeholder
│   └── music.html                      # Spotify playlist embed
│
├── src/css/
│   ├── main.css                        # CSS variables, loader, page reveal, global styles
│   ├── layout.css                      # Topnav (fixed, 64px), footer, mobile hamburger
│   ├── hero.css                        # Hero section + about section layout
│   ├── gallery.css                     # Interest cards (4-column grid, hover overlays)
│   ├── collage.css                     # Year timeline + masonry photo grid
│   ├── contact.css                     # 2-column contact card + social links
│   ├── nyc-food.css                    # NYC food table, vibes badges, cluster columns
│   ├── national-parks.css              # Parks tiles, 3D flip cards, grouped sections
│   └── music.css                       # Music hero section + Spotify embed wrapper
│
├── src/js/
│   ├── loading.js                      # Two-word loader animation + page reveal + sessionStorage
│   ├── main.js                         # Homepage init: fetches APIs, renders sections, fade-in observer
│   ├── hero.js                         # Renders hero name/tagline, about section, interest cards, socials
│   ├── notion.js                       # SOCIAL_ICONS SVGs and INTERESTS card definitions
│   ├── subpage.js                      # Sub-page nav socials + footer from API
│   ├── collage.js                      # Year timeline + Cloudinary photo grid with seeded shuffle
│   ├── nyc-food.js                     # IIFE: list/cluster views, vibes categorization, sort, slideshow
│   ├── national-parks.js              # IIFE: tiles/grouped views, sort, hero fill effect, flip cards
│   ├── music.js                        # Placeholder (no functionality yet)
│   └── gallery.js                      # Placeholder (gallery removed in redesign)
│
├── content/                            # Fallback JSON when Notion API fails
│   ├── hero.json                       # greeting, name, tagline, footer
│   ├── about.json                      # photo, intro, paragraphs, stats
│   ├── contact.json                    # email, location, social links
│   └── gallery.json                    # Unused
│
└── assets/images/collage/              # Gitkeep dirs for 2023-2026 (photos served from Cloudinary)
```

## Color Palette

| Variable              | Hex         | Primary Usage                                                    |
|-----------------------|-------------|------------------------------------------------------------------|
| `--powder-petal`      | `#f9dec9`   | Page backgrounds, loading screen bg, button fills, light text    |
| `--fiery-terracotta`  | `#e94f37`   | Section titles, hover/active states, accent borders              |
| `--midnight-violet`   | `#351e29`   | Body text, headings, nav/footer bg, overlays                    |
| `--pine-blue`         | `#387780`   | Subtitles, labels, contact text, sort active indicators          |
| `--pacific-blue`      | `#729ea1`   | Section labels, timeline dots, badge borders                     |
| `--russet-clay`       | `#8C4843`   | Tagline text, about paragraphs, toggle bars, music hero bg       |

## Fonts

All loaded from Adobe TypeKit (`https://use.typekit.net/xbu1bwf.css`).

| Variable         | Font     | Weights   | Applied To                                    |
|------------------|----------|-----------|-----------------------------------------------|
| `--font-heading` | dinosaur | 700, 900  | Hero name, section titles, card titles, loader |
| `--font-body`    | dinosaur | 300, 500  | Body text, nav links, labels, badges           |
| `--font-mono`    | Courier New | —      | Section labels (uppercase, 0.75rem)            |

## Pages

| Page               | URL                         | Content                                              |
|--------------------|-----------------------------|------------------------------------------------------|
| Home               | `/`                         | Hero (tagline left, name right), interests, collage, about, contact |
| NYC Food           | `/pages/nyc-food.html`      | Restaurant list/cluster with vibes & ratings          |
| National Parks     | `/pages/national-parks.html`| Parks as tiles or grouped (visited/unvisited)         |
| Coffee Map         | `/pages/coffee-map.html`    | Coming soon placeholder                              |
| Music              | `/pages/music.html`         | Spotify playlist embed                                |

## Notion Databases

All use Notion API version `2022-06-28`, auth via `NOTION_TOKEN` env var.

**Hero DB** (`NOTION_HERO_DB` env var) — Key-value pairs
- Columns: `Property` (rich_text), `Value` (rich_text), `Publish` (checkbox)
- Keys: `hero-main` (name), `hero-sub` (tagline), `greeting`, `footer`

**About DB** (`NOTION_ABOUT_DB` env var) — Single row
- Columns: `intro`, `paragraphs`, `photo` (url), `stat1_number`/`stat1_label`/`stat1_plus`, `stat2_*`, `stat3_*`

**Contact DB** (`NOTION_CONTACT_DB` env var) — Key-value pairs
- Columns: `Property` (rich_text), `Value` (url), `Publish` (checkbox)
- Keys: `email`, `location`, `linkedin`, `github`, `instagram`, `twitter`, `youtube`

**NYC Food DB** (`32447c2584f880b2ad1aecd4e216959c` hardcoded)
- Columns: `Name`, `Rating` (number), `Google Maps Link` (url), `Vibes` (select)

**National Parks DB** (`32447c2584f880c48276c703b9af88af` hardcoded)
- Columns: `Name`, `Location`, `Visitors` (number), `Visited` (checkbox), `Year Visited` (number), `Park Pic` (url), `My Pic` (url)

## Cloudinary Folders

Cloud name from `CLOUDINARY_CLOUD_NAME` env var.

| Folder Path                                        | Content          | Endpoint                |
|----------------------------------------------------|------------------|-------------------------|
| `sarthak-website/hero`                             | Hero video       | `/api/hero-video`       |
| `sarthak-website/memories/{year}`                  | Collage photos   | `/api/collage/:year`    |
| `sarthak-website/interests/nyc-food/hero-slide`    | NYC slideshow    | `/api/cloudinary/photos`|
| `sarthak-website/interests/national-parks/hero-slide` | Parks slideshow | `/api/cloudinary/photos`|

## Patterns & Conventions

**Data flow:** Client fetches from Express API endpoints -> server queries Notion/Cloudinary -> falls back to `/content/*.json` on failure.

**Loading pattern:** `loading.js` runs first on every page, sets `window.loadingPromises = []`. Other scripts push fetch promises into this array. Loader dismisses when both the word animation (~8.4s) AND all promises resolve. 10s safety timeout.

**Session logic:** `sessionStorage('hasSeenIntro')` controls page reveal. Loading screen shows on every page load. Cinematic reveal animation (nav from top, tagline from left, name from right, video from bottom) only plays on first home page visit per session.

**Sub-page scripts:** Always load `loading.js` first, then `notion.js`, `subpage.js`, then page-specific JS.

**State management:** NYC Food and National Parks use IIFE closures with internal state (currentView, sortKey). No frameworks.

**CSS conventions:** kebab-case with component prefix (`nyc-hero`, `np-tile-grid`). Responsive at 768px and 480px. Fluid typography via `clamp()`.

**JS conventions:** camelCase variables. Data attributes for view state (`data-view`, `data-vibes`, `data-col`).

**Notion helper functions** in server.js: `getText()`, `getNumber()`, `getCheckbox()`, `getUrl()`, `getSelect()` extract typed values from Notion property objects.

## Dev Server

Run with `node server/server.js` on port 3000. Serves static files from project root.

## Git Workflow

IMPORTANT: Never commit or push directly to main.

For every session follow this exact workflow:

1. Before making any changes, create a new branch:
   ```
   git checkout -b [descriptive-branch-name]
   ```
   Branch naming convention:
   - `feature/description` — new features
   - `fix/description` — bug fixes
   - `style/description` — visual/CSS changes
   - `content/description` — content updates

   Examples: `feature/nyc-food-cluster-animation`, `fix/loading-screen-timing`, `style/navbar-hover-effects`

2. Make all changes and commits on that branch.

3. When session work is complete, push the branch:
   ```
   git push origin [branch-name]
   ```

4. Create a Pull Request on GitHub from that branch into main.

5. Never merge — leave the PR open for review.
