import { XMLParser } from 'fast-xml-parser';

export async function fetchSubsPlease() {
  const SUBSPLEASE_RSS = "https://subsplease.org/rss/?r=1080";
  console.log("[Fetcher] Grabbing live SubsPlease RSS feed...");
  
  const response = await fetch(SUBSPLEASE_RSS);
  const xmlData = await response.text();

  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xmlData);
  const items = parsed.rss?.channel?.item || [];

  return items.map(item => ({
    raw_title: item.title,
    magnet: item.link,
    size: item["tv:contentLength"] ? `${(item["tv:contentLength"] / 1073741824).toFixed(1)} GB` : "Unknown",
    pub_date: new Date(item.pubDate).toISOString(),
    source_group: "SubsPlease"
  }));
}

// THE NEW BACKFILL ENGINE BASED ON YOUR URL PATTERN
export async function backfillSubsPlease(animeId) {
  try {
    console.log(`[Backfill] Hunting for historical episodes of: ${animeId}`);
    
    // 1. Visit the show page using the slug pattern
    const pageRes = await fetch(`https://subsplease.org/shows/${animeId}/`);
    if (!pageRes.ok) return [];
    
    const html = await pageRes.text();

    // 2. Extract their internal hidden "sid" (Show ID) from the HTML table
    const sidMatch = html.match(/sid="(\d+)"/);
    if (!sidMatch) return [];
    
    const sid = sidMatch[1];

    // 3. Hit their private API to get the entire season/show history
    const apiRes = await fetch(`https://subsplease.org/api/?f=show&tz=UTC&sid=${sid}`);
    const apiData = await apiRes.json();

    const historicalEpisodes = [];

    // 4. Standardize the old episodes so they fit our database perfectly
    if (apiData && apiData.episode) {
      for (const [epNum, qualities] of Object.entries(apiData.episode)) {
        // Prefer 1080p, fallback to 720p if needed
        const q = qualities["1080"] ? "1080" : (qualities["720"] ? "720" : null);
        if (q) {
          const release = qualities[q];
          historicalEpisodes.push({
            episode: epNum,
            magnet: release.magnet,
            size: release.size || "Unknown",
            pub_date: release.release_date || new Date().toISOString(),
            resolution: `${q}p`,
            group: "SubsPlease"
          });
        }
      }
    }
    return historicalEpisodes;
  } catch (err) {
    console.error(`[Backfill] Error scraping history for ${animeId}:`, err);
    return [];
  }
}
