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

export async function backfillSubsPlease(animeId) {
  try {
    // Some shows have trailing punctuation stripped incorrectly. Let's find it securely.
    console.log(`[Backfill] Hunting for historical episodes of: ${animeId}`);
    
    // First attempt: direct slug match
    let pageRes = await fetch(`https://subsplease.org/shows/${animeId}/`);
    
    // Fallback: If 404, we search their master API directly
    if (!pageRes.ok) {
        console.log(`[Backfill] Direct link failed. Searching master API for ${animeId}...`);
        const searchRes = await fetch('https://subsplease.org/api/?f=shows&tz=UTC');
        const searchData = await searchRes.json();
        
        // Try to find the closest matching slug
        const matchingShow = Object.keys(searchData).find(key => key.toLowerCase().includes(animeId.replace(/-/g, ' ')));
        
        if (!matchingShow) {
             console.log(`[Backfill] Could not find match in master API either.`);
             return []; // Let it fail gracefully
        }
        
        pageRes = await fetch(`https://subsplease.org/shows/${searchData[matchingShow]}/`);
        if (!pageRes.ok) return [];
    }
    
    const html = await pageRes.text();
    const sidMatch = html.match(/sid="(\d+)"/);
    if (!sidMatch) {
       console.log(`[Backfill] Could not extract internal sid from HTML.`);
       return [];
    }
    
    const sid = sidMatch[1];
    const apiRes = await fetch(`https://subsplease.org/api/?f=show&tz=UTC&sid=${sid}`);
    const apiData = await apiRes.json();

    const historicalEpisodes = [];
    if (apiData && apiData.episode) {
      for (const [epNum, qualities] of Object.entries(apiData.episode)) {
        const q = qualities["1080"] ? "1080" : (qualities["720"] ? "720" : null);
        if (q) {
          const release = qualities[q];
          historicalEpisodes.push({
            episode: epNum, magnet: release.magnet, size: release.size || "Unknown",
            pub_date: release.release_date || new Date().toISOString(),
            resolution: `${q}p`, group: "SubsPlease"
          });
        }
      }
    }
    return historicalEpisodes;
  } catch (err) {
    console.error(`[Backfill] Network error scraping history for ${animeId}:`, err);
    return [];
  }
}
