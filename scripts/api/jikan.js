export async function fetchAnimeDetails(title) {
  try {
    // 1-second pause to respect Jikan's strict rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`[API] Fetching full details from Jikan for: ${title}`);
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
    
    if (!res.ok) return null;
    
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      const data = json.data[0];
      return {
        poster: data.images?.jpg?.large_image_url || null,
        synopsis: data.synopsis || "No synopsis available.",
        score: data.score || "N/A",
        genres: data.genres ? data.genres.map(g => g.name) : [],
        status: data.status || "Unknown",
        year: data.year || (data.aired?.prop?.from?.year) || "Unknown",
        episodes: data.episodes || "Ongoing"
      };
    }
  } catch (err) {
    console.error(`Failed to fetch details for ${title}:`, err);
  }
  return null;
}
