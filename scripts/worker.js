import fs from 'fs';
import path from 'path';
import { processRelease } from './parser.js';
import { fetchAnimeDetails } from './api/jikan.js';
import { fetchSubsPlease, backfillSubsPlease } from './fetchers/subsplease.js';

const DB_DIR = path.resolve("./db");
const LATEST_FEED_PATH = path.join(DB_DIR, "latest", "feed.json");

const readJSON = (filePath) => {
  if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return null;
};

const writeJSON = (filePath, data) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

async function fetchAndProcess() {
  console.log("Starting Indexer Engine...");
  const items = await fetchSubsPlease();
  let latestFeed = readJSON(LATEST_FEED_PATH) || [];
  let newUpdates = false;
  let newEntries = [];

  for (const rawRelease of items) {
    const result = processRelease(rawRelease);
    if (result.status === "quarantined") continue;

    const animeData = result.data;
    const animeId = animeData.anime_id;

    if (
      latestFeed.some(f => f.id === `${animeId}-${animeData.episode}`) ||
      newEntries.some(f => f.id === `${animeId}-${animeData.episode}`)
    ) {
      continue;
    }

    console.log(`Processing: ${animeData.clean_title} - EP ${animeData.episode}`);
    newUpdates = true;

    const animeFilePath = path.join(DB_DIR, "anime", `${animeId}.json`);
    let animeHistory = readJSON(animeFilePath) || {
      id: animeId, title: animeData.clean_title, poster: null, details: null, backfilled: false, episodes: {}
    };

    if (!animeHistory.details) {
      const details = await fetchAnimeDetails(animeData.clean_title);
      animeHistory.details = details || {};
      animeHistory.poster = details?.poster || animeHistory.poster;
    }

    // THE FIX: If backfill returns empty, do NOT mark it as completely backfilled. Give it another chance later.
    if (!animeHistory.backfilled) {
      const oldEpisodes = await backfillSubsPlease(animeId);
      if (oldEpisodes.length > 0) {
          for (const item of oldEpisodes) {
            if (!animeHistory.episodes[item.episode]) {
              animeHistory.episodes[item.episode] = { released_at: item.pub_date, releases: [] };
            }
            const existing = animeHistory.episodes[item.episode].releases.find(r => r.group === item.group && r.resolution === item.resolution);
            if (!existing) {
               animeHistory.episodes[item.episode].releases.push({ group: item.group, resolution: item.resolution, magnet: item.magnet, size: item.size });
            }
          }
          animeHistory.backfilled = true;
          console.log(`[Backfill] Successfully saved ${oldEpisodes.length} historical episodes for ${animeId}`);
      } else {
          console.log(`[Backfill] Skipped locking ${animeId} to allow future retries.`);
      }
    }

    if (!animeHistory.episodes[animeData.episode]) {
      animeHistory.episodes[animeData.episode] = { released_at: animeData.pub_date, releases: [] };
    }

    animeHistory.episodes[animeData.episode].releases.push({
      group: animeData.group, resolution: animeData.resolution, magnet: animeData.magnet, size: animeData.size
    });

    writeJSON(animeFilePath, animeHistory);

    newEntries.push({
      id: `${animeId}-${animeData.episode}`, anime_id: animeId, clean_title: animeData.clean_title,
      episode: animeData.episode, group: animeData.group, resolution: animeData.resolution,
      seeders: Math.floor(Math.random() * 500) + 500, pub_date: animeData.pub_date,
      magnet: animeData.magnet, poster: animeHistory.poster
    });
  }

  if (newUpdates) {
    const combined = [...newEntries, ...latestFeed];
    const uniqueFeed = Array.from(new Map(combined.map(item => [item.id, item])).values());
    uniqueFeed.sort((a, b) => new Date(b.pub_date) - new Date(a.pub_date));

    writeJSON(LATEST_FEED_PATH, uniqueFeed);
    console.log("Database successfully generated.");
  } else {
    console.log("No new updates found.");
  }
}

fetchAndProcess().catch(console.error);
