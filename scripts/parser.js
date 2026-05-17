// The Multi-Stage Parsing Pipeline

// 1. The Alias Database
// This is your single source of truth for normalizing messy titles.
const ALIAS_DB = {
  "dandadan": ["dandadan", "dan da dan", "ダンダダン"],
  "one-piece": ["one piece", "one-piece", "ワンピース"],
  "kaiju-no-8": ["kaiju no 8", "kaiju no. 8", "monster #8"]
};

// 2. Noise Tags
// Garbage data that ruins matching algorithms.
const NOISE_TAGS = [
  "1080p", "720p", "480p", "x265", "hevc", "aac", "webrip", 
  "dual audio", "batch", "end", "v2", "mkv", "mp4"
];

// Stage 1: Raw Extraction
function extractMetadata(rawTitle) {
  let group = "Unknown";
  const groupMatch = rawTitle.match(/^\[(.*?)\]/);
  if (groupMatch) group = groupMatch[1];

  let resolution = "Unknown";
  if (rawTitle.toLowerCase().includes("1080p")) resolution = "1080p";
  else if (rawTitle.toLowerCase().includes("720p")) resolution = "720p";
  else if (rawTitle.toLowerCase().includes("480p")) resolution = "480p";

  let episode = "Unknown";
  const epMatch = rawTitle.match(/(?:-|EP|E)\s*(\d+(?:\.\d+)?)/i);
  if (epMatch) episode = epMatch[1];

  return { group, resolution, episode };
}

// Stage 2 & 3: Normalization & Noise Removal
function cleanAndNormalize(rawTitle) {
  let cleaned = rawTitle.toLowerCase();
  
  // Strip group tags
  cleaned = cleaned.replace(/^\[.*?\]/, '');
  
  // Strip noise tags
  NOISE_TAGS.forEach(tag => {
    const regex = new RegExp(`\\b${tag}\\b|\\[${tag}\\]|\\(${tag}\\)`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  // Strip episode numbers and loose punctuation
  cleaned = cleaned.replace(/(?:-|ep|e)\s*\d+(?:\.\d+)?/gi, '');
  cleaned = cleaned.replace(/[\[\]\(\)\-\.]/g, ' ').trim();
  
  // Normalize spacing
  return cleaned.replace(/\s+/g, ' ');
}

// Stage 4: Anime Name Detection
function matchAnime(cleanedTitle) {
  for (const [animeId, aliases] of Object.entries(ALIAS_DB)) {
    // Exact Alias Match (Confidence: 100%)
    if (aliases.includes(cleanedTitle)) {
      return { animeId, confidence: 1.0 };
    }
    
    // Fuzzy/Partial Match (Confidence: 85%)
    for (const alias of aliases) {
      if (cleanedTitle.includes(alias) || alias.includes(cleanedTitle)) {
        return { animeId, confidence: 0.85 }; 
      }
    }
  }
  return null;
}

// Main Execution Function
export function processRelease(rawRelease) {
  const { raw_title } = rawRelease;
  
  const { group, resolution, episode } = extractMetadata(raw_title);
  const cleanedTitle = cleanAndNormalize(raw_title);
  const match = matchAnime(cleanedTitle);

  // The Quarantine System 
  if (!match || match.confidence < 0.90) {
    return {
      status: "quarantined",
      data: {
        ...rawRelease,
        extracted_group: group,
        cleaned_attempt: cleanedTitle
      }
    };
  }

  // Success: Return perfectly structured data ready for your sharded JSON database
  return {
    status: "success",
    data: {
      anime_id: match.animeId,
      episode,
      group,
      resolution,
      raw_title,
      magnet: rawRelease.magnet,
      size: rawRelease.size,
      pub_date: rawRelease.pub_date
    }
  };
}
