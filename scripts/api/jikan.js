export async function fetchPoster(title) {
  try {
    // 1-second pause to respect Jikan's strict rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`[API] Fetching official poster from Jikan for: ${title}`);
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
    
    if (!res.ok) return null;
    
    const json = await res.json();
    if (json.data && json.data.length > 0 && json.data[0].images?.jpg?.large_image_url) {
      return json.data[0].images.jpg.large_image_url;
    }
  } catch (err) {
    console.error(`Failed to fetch poster for ${title}:`, err);
  }
  return null;
}
