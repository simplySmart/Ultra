import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { processRelease } from './parser.js';

const SUBSPLEASE_RSS = "https://subsplease.org/rss/?r=1080";
const DB_DIR = path.resolve("./db");
const LATEST_FEED_PATH = path.join(DB_DIR, "latest", "feed.json");

// Helper to safely read JSON
const readJSON = (filePath) => {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return null;
};

// Helper to save JSON beautifully
const writeJSON = (filePath, data) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

async function fetchAndProcess() {
  console.log("Fetching RSS feeds...");
  const response = await fetch(SUBSPLEASE_RSS);
  const xmlData = await response.text();

  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xmlData);
  const items = parsed.rss.channel.item || [];

  let latestFeed = readJSON(LATEST_FEED_PATH) || [];
  let newUpdates = false;

  for (const item of items) {
    const rawRelease = {
      raw_title: item.title,
      magnet: item.link,
      size: item["tv:contentLength"] ? `${(item["tv:contentLength"] / 1073741824).toFixed(1)} GB` : "Unknown",
      pub_date: new Date(item.pubDate).toISOString(), // Strict UTC storage
    };

    // Run through our multi-stage parser
    const result = processRelease(rawRelease);

    if (result.status === "quarantined") {
      // Save unmatched releases to quarantine for manual review later
      const qPath = path.join(DB_DIR, "quarantine", "unmatched.json");
      const quarantine = readJSON(qPath) || [];
      if (!quarantine.some(q => q.raw_title === rawRelease.raw_title)) {
        quarantine.push(result.data);
        writeJSON(qPath, quarantine);
      }
      continue;
    }

    const animeData = result.data;
    const animeId = animeData.anime_id;
    
    // Check if this specific release is already in our latest feed to prevent duplicates
    if (latestFeed.some(feedItem => feedItem.id === `${animeId}-${animeData.episode}`)) {
      continue; 
    }

    console.log(`New Release Found: ${animeData.clean_title} - EP ${animeData.episode}`);
    newUpdates = true;

    // 1. Update Sharded Anime History (anime/{id}.json)
    const animeFilePath = path.join(DB_DIR, "anime", `${animeId}.json`);
    let animeHistory = readJSON(animeFilePath) || {
      id: animeId,
      title: animeData.clean_title,
      episodes: {}
    };

    if (!animeHistory.episodes[animeData.episode]) {
      animeHistory.episodes[animeData.episode] = {
        released_at: animeData.pub_date,
        releases: []
      };
    }
    
    animeHistory.episodes[animeData.episode].releases.push({
      group: animeData.group,
      resolution: animeData.resolution,
      magnet: animeData.magnet,
      size: animeData.size
    });

    writeJSON(animeFilePath, animeHistory);

    // 2. Add to the Global Latest Feed (Used for UI rendering)
    latestFeed.unshift({
      id: `${animeId}-${animeData.episode}`,
      clean_title: animeData.clean_title,
      episode: animeData.episode,
      group: animeData.group,
      resolution: animeData.resolution,
      size: animeData.size,
      seeders: Math.floor(Math.random() * 500) + 500, // Placeholder until we hook up the tracker API
      pub_date: animeData.pub_date,
      magnet: animeData.magnet,
      image_url: "https://cdn.myanimelist.net/images/anime/1015/144233l.jpg" // Placeholder for Jikan enrichment
    });
  }

  if (newUpdates) {
    // Keep only the newest 100 entries to prevent bloat
    latestFeed = latestFeed.slice(0, 100);
    writeJSON(LATEST_FEED_PATH, latestFeed);
    console.log("Database updated successfully.");
  } else {
    console.log("No new releases found. Database is up to date.");
  }
}

fetchAndProcess().catch(console.error);
