// ========================================
// SETUP-NOTION.JS — One-time Notion database setup script
// ========================================
// Run this ONCE with: node server/setup-notion.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const TOKEN = process.env.NOTION_TOKEN;

const HERO_DB = process.env.NOTION_HERO_DB;
const ABOUT_DB = process.env.NOTION_ABOUT_DB;
const CONTACT_DB = process.env.NOTION_CONTACT_DB;

function readJSON(filename) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'content', filename), 'utf8'));
}

function richText(content) {
  return [{ text: { content } }];
}

async function updateDbProperties(dbId, properties) {
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ properties })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`DB update failed: ${err.message}`);
  }
}

async function setupHero() {
  const data = readJSON('hero.json');

  await updateDbProperties(HERO_DB, {
    greeting: { rich_text: {} },
    hero_name: { rich_text: {} },
    tagline: { rich_text: {} },
    footer: { rich_text: {} }
  });
  console.log('Hero DB: properties added');

  await notion.pages.create({
    parent: { database_id: HERO_DB },
    properties: {
      Name: { title: richText('main') },
      greeting: { rich_text: richText(data.greeting) },
      hero_name: { rich_text: richText(data.name) },
      tagline: { rich_text: richText(data.tagline) },
      footer: { rich_text: richText(data.footer) }
    }
  });
  console.log('Hero DB: row created');
}

async function setupAbout() {
  const data = readJSON('about.json');

  await updateDbProperties(ABOUT_DB, {
    photo: { url: {} },
    intro: { rich_text: {} },
    paragraphs: { rich_text: {} },
    stat1_number: { number: {} },
    stat1_label: { rich_text: {} },
    stat1_plus: { checkbox: {} },
    stat2_number: { number: {} },
    stat2_label: { rich_text: {} },
    stat2_plus: { checkbox: {} },
    stat3_number: { number: {} },
    stat3_label: { rich_text: {} },
    stat3_plus: { checkbox: {} }
  });
  console.log('About DB: properties added');

  const props = {
    Name: { title: richText('main') },
    intro: { rich_text: richText(data.intro) },
    paragraphs: { rich_text: richText(data.paragraphs.join('\n')) }
  };

  if (data.photo) {
    props.photo = { url: data.photo };
  }

  data.stats.forEach((stat, i) => {
    const n = i + 1;
    props[`stat${n}_number`] = { number: stat.number };
    props[`stat${n}_label`] = { rich_text: richText(stat.label) };
    props[`stat${n}_plus`] = { checkbox: !!stat.plus };
  });

  await notion.pages.create({
    parent: { database_id: ABOUT_DB },
    properties: props
  });
  console.log('About DB: row created');
}

async function setupContact() {
  const data = readJSON('contact.json');

  await updateDbProperties(CONTACT_DB, {
    email: { rich_text: {} },
    location: { rich_text: {} },
    linkedin_url: { url: {} },
    github_url: { url: {} },
    instagram_url: { url: {} }
  });
  console.log('Contact DB: properties added');

  const props = {
    Name: { title: richText('main') },
    email: { rich_text: richText(data.email) },
    location: { rich_text: richText(data.location) }
  };

  const urlKeys = ['linkedin_url', 'github_url', 'instagram_url'];
  data.socials.forEach(social => {
    const key = `${social.platform}_url`;
    if (urlKeys.includes(key) && social.url && social.url !== '#') {
      props[key] = { url: social.url };
    }
  });

  await notion.pages.create({
    parent: { database_id: CONTACT_DB },
    properties: props
  });
  console.log('Contact DB: row created');
}

async function main() {
  console.log('Setting up Notion databases...\n');
  await setupHero();
  await setupAbout();
  await setupContact();
  console.log('\nDone! All databases configured and populated.');
}

main().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
