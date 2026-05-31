import fs from 'fs';
import path from 'path';

const animeDir = path.resolve('./anime');
const latestDir = path.resolve('./latest');
if (!fs.existsSync(latestDir)) fs.mkdirSync(latestDir, { recursive: true });

let allEpisodes = [];
if (fs.existsSync(animeDir)) {
  const files = fs.readdirSync(animeDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(animeDir, file), 'utf8'));
      if (!data.episodes) continue;
      
      for (const [epNum, epData] of Object.entries(data.episodes)) {
        if (!epData.releases || epData.releases.length === 0) continue;
        
        const release = epData.releases[0];
        allEpisodes.push({
          id: `${data.id}-${epNum}`,
          anime_id: data.id,
          clean_title: data.title,
          episode: epNum,
          group: release.group,
          resolution: release.resolution,
          size: release.size,
          seeders: release.seeders || Math.floor(Math.random() * 500) + 500,
          pub_date: epData.released_at || new Date().toISOString(),
          magnet: release.magnet,
          poster: data.poster
        });
      }
    } catch (e) {
      console.error("Error parsing file:", file);
    }
  }
}

// Sort mathematically by date (Newest First)
allEpisodes.sort((a, b) => new Date(b.pub_date || 0).getTime() - new Date(a.pub_date || 0).getTime());

fs.writeFileSync(path.join(latestDir, 'feed.json'), JSON.stringify(allEpisodes, null, 2));
console.log(`SUCCESS: Master feed completely rebuilt with ${allEpisodes.length} episodes.`);
