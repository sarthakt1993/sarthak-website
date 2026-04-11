# Sarthak Tandon — Personal Website

## Overview

A personal portfolio and travel showcase website built with vanilla HTML, CSS, and JavaScript, powered by a Node.js/Express backend. The site integrates Notion as a headless CMS for dynamic content management and Cloudinary for media hosting. It features a cinematic loading experience, interactive data views for NYC restaurants and national parks, a yearly photo collage, and embedded Spotify playlists.

## Live URL

https://sarthaktandon.me

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (vanilla, no frameworks)
- **Server:** Node.js with Express v5
- **Hosting:** Vercel
- **CMS:** Notion API (`@notionhq/client`)
- **Media:** Cloudinary (images and video)
- **Environment:** dotenv
- **Version Control:** GitHub

## Site Structure

| Page | Path | Description |
|------|------|-------------|
| Home | `/index.html` | Hero section with video background, interest cards, yearly photo collage, about section, and contact info |
| NYC Food | `/pages/nyc-food.html` | NYC restaurant guide with list and cluster views, vibes categorization, and ratings |
| National Parks | `/pages/national-parks.html` | National parks explorer with tile and grouped views, 3D flip cards, and visited/unvisited filtering |
| Coffee Map | `/pages/coffee-map.html` | Coming soon placeholder |
| Music | `/pages/music.html` | Spotify playlist embed with a styled hero section |

## Folder Structure

```
sarthak-website/
├── assets/
│   ├── images/
│   │   ├── collage/
│   │   │   ├── 2023/
│   │   │   ├── 2024/
│   │   │   ├── 2025/
│   │   │   └── 2026/
│   │   ├── gallery/
│   │   │   ├── europe/
│   │   │   ├── india/
│   │   │   ├── japan/
│   │   │   └── southeast-asia/
│   │   ├── interests/
│   │   └── profile/
│   └── videos/
├── content/
│   ├── about.json
│   ├── contact.json
│   ├── gallery.json
│   └── hero.json
├── pages/
│   ├── coffee-map.html
│   ├── music.html
│   ├── national-parks.html
│   └── nyc-food.html
├── server/
│   ├── server.js
│   └── setup-notion.js
├── src/
│   ├── css/
│   │   ├── collage.css
│   │   ├── contact.css
│   │   ├── gallery.css
│   │   ├── hero.css
│   │   ├── layout.css
│   │   ├── main.css
│   │   ├── music.css
│   │   ├── national-parks.css
│   │   └── nyc-food.css
│   └── js/
│       ├── collage.js
│       ├── gallery.js
│       ├── hero.js
│       ├── loading.js
│       ├── main.js
│       ├── music.js
│       ├── national-parks.js
│       ├── notion.js
│       ├── nyc-food.js
│       └── subpage.js
├── .env
├── CLAUDE.md
├── index.html
├── package.json
└── README.md
```

## Notion Databases

| Database | ID | Powers |
|----------|----|--------|
| Hero | `NOTION_HERO_DB` env var | Hero section greeting, name, tagline, and footer text |
| About | `NOTION_ABOUT_DB` env var | About section intro, paragraphs, stats, and profile photo |
| Contact | `NOTION_CONTACT_DB` env var | Contact info including email, location, and social links |
| NYC Food | `32447c2584f880b2ad1aecd4e216959c` | Restaurant names, ratings, Google Maps links, and vibes categories |
| National Parks | `32447c2584f880c48276c703b9af88af` | Park names, locations, visitor counts, visited status, and photos |

## Cloudinary Structure

| Folder Path | Content | API Endpoint |
|-------------|---------|--------------|
| `sarthak-website/hero` | Hero background video | `/api/hero-video` |
| `sarthak-website/memories/{year}` | Yearly collage photos (2023-2026) | `/api/collage/:year` |
| `sarthak-website/interests/nyc-food/hero-slide` | NYC Food page slideshow images | `/api/cloudinary/photos` |
| `sarthak-website/interests/national-parks/hero-slide` | National Parks page slideshow images | `/api/cloudinary/photos` |

## Color Palette

| Variable | Hex | Usage |
|----------|-----|-------|
| `--powder-petal` | `#f9dec9` | Page backgrounds, loading screen, button fills, light text |
| `--fiery-terracotta` | `#e94f37` | Section titles, hover/active states, accent borders |
| `--midnight-violet` | `#351e29` | Body text, headings, nav/footer backgrounds, overlays |
| `--pine-blue` | `#387780` | Subtitles, labels, contact text, sort active indicators |
| `--pacific-blue` | `#729ea1` | Section labels, timeline dots, badge borders |
| `--russet-clay` | `#8C4843` | Tagline text, about paragraphs, toggle bars, music hero background |

## Environment Variables

The following environment variables are required (create a `.env` file in the project root):

- `NOTION_TOKEN` — Notion API integration token
- `NOTION_HERO_DB` — Notion database ID for hero content
- `NOTION_ABOUT_DB` — Notion database ID for about content
- `NOTION_CONTACT_DB` — Notion database ID for contact content
- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- `CLOUDINARY_API_KEY` — Cloudinary API key
- `CLOUDINARY_API_SECRET` — Cloudinary API secret

## Local Development

### Prerequisites

- Node.js (v18 or later recommended)
- npm
- A Notion integration token and database IDs
- A Cloudinary account with API credentials

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/sarthaktandon/sarthak-website.git
   cd sarthak-website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with your credentials:
   ```
   NOTION_TOKEN=your_notion_token
   NOTION_HERO_DB=your_hero_db_id
   NOTION_ABOUT_DB=your_about_db_id
   NOTION_CONTACT_DB=your_contact_db_id
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. Start the server:
   ```bash
   node server/server.js
   ```

5. Open http://localhost:3000 in your browser.

> **Note:** If the Notion API is unreachable, the site falls back to local JSON files in the `content/` directory.

## Git Workflow

- **Never commit or push directly to main.**
- Create a new branch for every session:
  ```bash
  git checkout -b feature/your-feature-name
  ```
- **Branch naming conventions:**
  - `feature/description` — new features
  - `fix/description` — bug fixes
  - `style/description` — visual/CSS changes
  - `content/description` — content updates
- Push the branch and create a Pull Request into main.
- Leave PRs open for review — never merge directly.
- Update README.md in the same commit as any major change.

## Recent Changes

- 2026-04-11 — Initial README created
