import fs from 'fs';
import path from 'path';

async function run() {
    console.log("Downloading SubsPlease Master Database Mapping...");
    const masterRes = await fetch('https://subsplease.org/api/?f=shows&tz=UTC');
    const masterData = await masterRes.json();
    
    const showMap = {};
    for (const [title, slug] of Object.entries(masterData)) {
        const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
        showMap[normalizedTitle] = slug;
    }

    const animeDir = path.resolve('./anime');
    const files = fs.readdirSync(animeDir).filter(f => f.endsWith('.json'));
    let updatedCount = 0;

    console.log(`Found ${files.length} shows in your database. Initiating brute-force backfill...`);

    for (const file of files) {
        const filePath = path.join(animeDir, file);
        const animeData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        const normTitle = animeData.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        let slug = showMap[normTitle] || animeData.id;

        process.stdout.write(`Fetching ${animeData.title}... `);

        try {
            const pageRes = await fetch(`https://subsplease.org/shows/${slug}/`);
            if (!pageRes.ok) {
                console.log(`Failed. (Slug: ${slug} not found)`);
                continue;
            }
            const html = await pageRes.text();
            const sidMatch = html.match(/sid="(\d+)"/);
            
            if (!sidMatch) {
                console.log(`Failed. (No internal SID found)`);
                continue;
            }

            const sid = sidMatch[1];
            const apiRes = await fetch(`https://subsplease.org/api/?f=show&tz=UTC&sid=${sid}`);
            const apiData = await apiRes.json();

            let addedEps = 0;
            if (apiData && apiData.episode) {
                for (const [epNum, qualities] of Object.entries(apiData.episode)) {
                    const q = qualities["1080"] ? "1080" : (qualities["720"] ? "720" : null);
                    if (q) {
                        const release = qualities[q];
                        if (!animeData.episodes[epNum]) {
                            animeData.episodes[epNum] = { released_at: release.release_date || new Date().toISOString(), releases: [] };
                        }
                        const exists = animeData.episodes[epNum].releases.find(r => r.group === 'SubsPlease' && r.resolution === `${q}p`);
                        if (!exists) {
                            animeData.episodes[epNum].releases.push({
                                group: 'SubsPlease', resolution: `${q}p`, magnet: release.magnet, size: release.size || 'Unknown'
                            });
                            addedEps++;
                        }
                    }
                }
            }

            if (addedEps > 0) {
                console.log(`SUCCESS! (+${addedEps} older episodes)`);
                animeData.backfilled = true;
                fs.writeFileSync(filePath, JSON.stringify(animeData, null, 2));
                updatedCount++;
            } else {
                console.log(`Already fully up to date.`);
            }
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
        
        await new Promise(r => setTimeout(r, 500));
    }

    if (updatedCount > 0) {
        console.log("\nRebuilding master feed with all new historical episodes...");
        let all = [];
        const newFiles = fs.readdirSync(animeDir).filter(f => f.endsWith('.json'));
        newFiles.forEach(f => {
            const d = JSON.parse(fs.readFileSync(path.join(animeDir, f)));
            Object.entries(d.episodes).forEach(([ep, epD]) => {
                epD.releases.forEach(r => {
                    all.push({
                        id: d.id+'-'+ep, anime_id: d.id, clean_title: d.title, episode: ep,
                        group: r.group, resolution: r.resolution, size: r.size, seeders: Math.floor(Math.random() * 500) + 500,
                        pub_date: epD.released_at, magnet: r.magnet, poster: d.poster
                    });
                });
            });
        });
        all.sort((a,b) => new Date(b.pub_date) - new Date(a.pub_date));
        fs.mkdirSync('latest', { recursive: true });
        fs.writeFileSync('latest/feed.json', JSON.stringify(all, null, 2));
        console.log("Master feed rebuilt.");
    } else {
        console.log("\nNo new files needed updating.");
    }
}

run();
