import { XMLParser } from 'fast-xml-parser';

export async function fetchSubsPlease() {
  const SUBSPLEASE_RSS = "https://subsplease.org/rss/?r=1080";
  console.log("[Fetcher] Grabbing SubsPlease RSS feed...");
  
  const response = await fetch(SUBSPLEASE_RSS);
  const xmlData = await response.text();

  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xmlData);
  const items = parsed.rss?.channel?.item || [];

  // Standardize the data so the worker doesn't care where it came from
  return items.map(item => ({
    raw_title: item.title,
    magnet: item.link,
    size: item["tv:contentLength"] ? `${(item["tv:contentLength"] / 1073741824).toFixed(1)} GB` : "Unknown",
    pub_date: new Date(item.pubDate).toISOString(),
    source_group: "SubsPlease"
  }));
}
