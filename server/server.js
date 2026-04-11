// ========================================
// SERVER.JS — Express backend for Sarthak's website
// ========================================
// Serves static files and provides API endpoints that fetch from Notion.
// Falls back to local JSON files in content/ if Notion is unreachable.
//
// To start: node server/server.js
// The site will be available at http://localhost:3000
// ========================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

// Project root is one level up from server/
const ROOT = path.join(__dirname, '..');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const HERO_DB = process.env.NOTION_HERO_DB;
const ABOUT_DB = process.env.NOTION_ABOUT_DB;
const CONTACT_DB = process.env.NOTION_CONTACT_DB;

// Serve all static files from the project root directory
app.use(express.static(ROOT));

// ========================================
// Helper Functions
// ========================================

function readLocalJSON(filename) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'content', filename), 'utf8'));
}

function getText(prop) {
  if (!prop) return '';
  if (prop.type === 'rich_text') {
    return (prop.rich_text || []).map(t => t.plain_text).join('');
  }
  if (prop.type === 'title') {
    return (prop.title || []).map(t => t.plain_text).join('');
  }
  return '';
}

function getNumber(prop) {
  if (!prop || prop.type !== 'number') return null;
  return prop.number;
}

function getCheckbox(prop) {
  if (!prop || prop.type !== 'checkbox') return false;
  return prop.checkbox;
}

function getUrl(prop) {
  if (!prop || prop.type !== 'url') return '';
  return prop.url || '';
}

function getSelect(prop) {
  if (!prop || prop.type !== 'select' || !prop.select) return '';
  return prop.select.name || '';
}

async function queryFirstRow(dbId) {
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ page_size: 1 })
  });
  if (!res.ok) throw new Error(`Notion API error: ${res.status}`);
  const data = await res.json();
  if (!data.results || !data.results.length) return null;
  return data.results[0].properties;
}

async function queryAllRows(dbId) {
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ page_size: 100 })
  });
  if (!res.ok) throw new Error(`Notion API error: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

// ========================================
// API Routes
// ========================================

app.get('/api/hero', async (req, res) => {
  const fallback = readLocalJSON('hero.json');
  try {
    const rows = await queryAllRows(HERO_DB);
    if (!rows.length) return res.json(fallback);

    const published = {};
    rows.forEach(row => {
      const props = row.properties;
      const name = getText(props.Property);
      const publish = getCheckbox(props.Publish);
      const value = getText(props.Value);
      if (name && publish && value) {
        published[name] = value;
      }
    });

    if (!Object.keys(published).length) return res.json(fallback);

    return res.json({
      name: published['hero-main'] || fallback.name,
      tagline: published['hero-sub'] || fallback.tagline,
      footer: published['footer'] || fallback.footer
    });
  } catch (err) {
    console.error('Notion hero fetch failed:', err.message);
    res.json(fallback);
  }
});

app.get('/api/about', async (req, res) => {
  try {
    const props = await queryFirstRow(ABOUT_DB);
    if (props) {
      const intro = getText(props.intro);
      if (intro) {
        const paragraphsText = getText(props.paragraphs);
        const paragraphs = paragraphsText ? paragraphsText.split('\n').filter(Boolean) : [];

        const stats = [];
        for (let i = 1; i <= 3; i++) {
          const num = getNumber(props[`stat${i}_number`]);
          const label = getText(props[`stat${i}_label`]);
          if (num !== null && label) {
            const stat = { number: num, label };
            if (getCheckbox(props[`stat${i}_plus`])) {
              stat.plus = true;
            }
            stats.push(stat);
          }
        }

        return res.json({
          photo: getUrl(props.photo),
          intro,
          paragraphs,
          stats
        });
      }
    }
    res.json(readLocalJSON('about.json'));
  } catch (err) {
    console.error('Notion about fetch failed:', err.message);
    res.json(readLocalJSON('about.json'));
  }
});

app.get('/api/contact', async (req, res) => {
  try {
    const rows = await queryAllRows(CONTACT_DB);
    const fallback = readLocalJSON('contact.json');

    if (!rows.length) {
      return res.json(fallback);
    }

    const published = {};
    rows.forEach(row => {
      const props = row.properties;
      const name = getText(props.Property);
      const publish = getCheckbox(props.Publish);
      const value = getUrl(props.Value);

      if (name && publish && value) {
        published[name.toLowerCase()] = value;
      }
    });

    if (Object.keys(published).length === 0) {
      return res.json(fallback);
    }

    const email = published.email || fallback.email;
    const location = published.location || fallback.location;

    const socialPlatforms = ['linkedin', 'github', 'instagram', 'twitter', 'youtube'];
    const socials = [];

    socialPlatforms.forEach(platform => {
      if (published[platform]) {
        socials.push({ platform, url: published[platform] });
      } else {
        const fallbackSocial = fallback.socials.find(s => s.platform === platform);
        if (fallbackSocial && fallbackSocial.url && fallbackSocial.url !== '#') {
          socials.push(fallbackSocial);
        }
      }
    });

    return res.json({ email, location, socials });
  } catch (err) {
    console.error('Notion contact fetch failed:', err.message);
    res.json(readLocalJSON('contact.json'));
  }
});

app.get('/api/nyc-food', async (req, res) => {
  const NYC_FOOD_DB = '32447c2584f880b2ad1aecd4e216959c';
  try {
    const rows = await queryAllRows(NYC_FOOD_DB);
    const restaurants = rows.map(row => {
      const props = row.properties;
      return {
        name: getText(props.Name),
        rating: getNumber(props.Rating),
        googleMapsLink: getUrl(props['Google Maps Link']),
        vibes: getSelect(props.Vibes)
      };
    }).filter(r => r.name);
    res.json(restaurants);
  } catch (err) {
    console.error('Notion NYC food fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch restaurant data' });
  }
});

app.get('/api/national-parks', async (req, res) => {
  const NP_DB = '32447c2584f880c48276c703b9af88af';
  try {
    const rows = await queryAllRows(NP_DB);
    const parks = rows.map(row => {
      const props = row.properties;
      return {
        name: getText(props.Name),
        location: getText(props.Location),
        visitors: getNumber(props.Visitors),
        visited: getCheckbox(props.Visited),
        yearVisited: getNumber(props['Year Visited']),
        parkPic: getUrl(props['Park Pic']),
        myPic: getUrl(props['My Pic'])
      };
    }).filter(r => r.name);
    res.json(parks);
  } catch (err) {
    console.error('Notion national parks fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch parks data' });
  }
});

app.get('/api/hero-video', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'sarthak-website/hero',
      max_results: 1,
      resource_type: 'video'
    });
    const video = (result.resources || [])[0];
    if (video) {
      res.json({ url: video.secure_url });
    } else {
      res.json({ url: null });
    }
  } catch (err) {
    console.error('Cloudinary hero video fetch failed:', err.message);
    res.json({ url: null });
  }
});

app.get('/api/cloudinary/photos', async (req, res) => {
  const folder = req.query.folder;
  if (!folder) {
    return res.status(400).json({ error: 'Missing folder query parameter' });
  }
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 500,
      resource_type: 'image'
    });
    const photos = (result.resources || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(r => r.secure_url);
    res.json({ photos });
  } catch (err) {
    console.error('Cloudinary fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch photos from Cloudinary' });
  }
});

app.get('/api/collage/:year', async (req, res) => {
  const year = req.params.year;
  if (!/^\d{4}$/.test(year)) {
    return res.status(400).json({ error: 'Invalid year' });
  }
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `sarthak-website/memories/${year}`,
      max_results: 500,
      resource_type: 'image'
    });
    const photos = (result.resources || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(r => r.secure_url);
    res.json(photos);
  } catch (err) {
    console.error('Cloudinary collage fetch failed:', err.message);
    res.json([]);
  }
});

// ========================================
// Start the server
// ========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
