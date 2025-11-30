// Native fetch is available in Node.js 18+

const activities = [
    { title: "Excursion en Kayak d’une Journée Complète", cost: 356.00, description: "Excursion en Kayak d’une Journée Complète", image_url: "", duration: 480, address: "Las Vegas", included_in_pass: false },
    { title: "Tour de Kayak Emerald Cave", cost: 177.00, description: "Tour de Kayak Emerald Cave", image_url: "", duration: 240, address: "Emerald Cave", included_in_pass: false },
    { title: "Musée de l'érotisme", cost: 56.00, description: "Musée de l'érotisme", image_url: "", duration: 90, address: "Las Vegas", included_in_pass: true },
    { title: "Magic Mike", cost: 135.00, description: "Magic Mike Live Show", image_url: "", duration: 90, address: "Sahara Las Vegas", included_in_pass: false },
    { title: "Musée d'histoire naturelle de Las Vegas", cost: 40.00, description: "Musée d'histoire naturelle", image_url: "", duration: 120, address: "Las Vegas", included_in_pass: true },
    { title: "Musée des voitures d'hollywood", cost: 125.00, description: "Musée des voitures d'hollywood", image_url: "", duration: 90, address: "Las Vegas", included_in_pass: true },
    { title: "Escape Game d'horreur", cost: 85.00, description: "Escape Game d'horreur", image_url: "", duration: 60, address: "Las Vegas", included_in_pass: true },
    { title: "TurntUp Freemont Crawl", cost: 150.00, description: "TurntUp Freemont Crawl", image_url: "", duration: 180, address: "Fremont Street", included_in_pass: false },
    { title: "Comedy Lounge Centre-ville", cost: 45.00, description: "Comedy Lounge Centre-ville", image_url: "", duration: 90, address: "Downtown Las Vegas", included_in_pass: true },
    { title: "One escape room", cost: 70.00, description: "One escape room", image_url: "", duration: 60, address: "Las Vegas", included_in_pass: true },
    { title: "La sphère ''Le magicien d'oz''", cost: 200.00, description: "La sphère ''Le magicien d'oz''", image_url: "", duration: 120, address: "The Sphere", included_in_pass: false },
    { title: "Le musée de la mafia", cost: 55.00, description: "The Mob Museum", image_url: "", duration: 120, address: "Downtown Las Vegas", included_in_pass: true },
    { title: "Rockstar Beachclub Experience Las Vegas", cost: 250.00, description: "Rockstar Beachclub Experience", image_url: "", duration: 300, address: "Las Vegas Strip", included_in_pass: true },
    { title: "RockStar Night Club", cost: 250.00, description: "RockStar Night Club Experience", image_url: "", duration: 300, address: "Las Vegas Strip", included_in_pass: true },
    { title: "Hoover Dam Tour Guidé", cost: 125.00, description: "Hoover Dam Tour Guidé", image_url: "", duration: 240, address: "Hoover Dam", included_in_pass: true },
    { title: "Rouge - le show le plus sexy", cost: 115.00, description: "Rouge - le show le plus sexy", image_url: "", duration: 90, address: "The STRAT", included_in_pass: true },
    { title: "Flyover experience", cost: 50.00, description: "Flyover experience", image_url: "", duration: 60, address: "Las Vegas Strip", included_in_pass: true },
    { title: "Paradox Museum", cost: 50.00, description: "Paradox Museum", image_url: "", duration: 90, address: "Las Vegas Strip", included_in_pass: true },
    { title: "Wow Spectacular", cost: 100.00, description: "Wow Spectacular Show", image_url: "", duration: 90, address: "Rio Hotel", included_in_pass: true },
    { title: "Van Gogh Experience", cost: 80.00, description: "Van Gogh Immersive Experience", image_url: "", duration: 90, address: "Las Vegas", included_in_pass: true },
    { title: "Big Bus", cost: 90.00, description: "Big Bus Hop-on Hop-off", image_url: "", duration: 1440, address: "Las Vegas Strip", included_in_pass: true },
    { title: "Go Car", cost: 250.00, description: "Go Car Tour", image_url: "", duration: 120, address: "Las Vegas", included_in_pass: true },
    { title: "Experience Off-Road", cost: 180.00, description: "Experience Off-Road", image_url: "", duration: 120, address: "Desert", included_in_pass: false },
    { title: "Dig This !", cost: 340.00, description: "Dig This ! Heavy Equipment Playground", image_url: "", duration: 90, address: "Las Vegas", included_in_pass: false },
    { title: "GO kart", cost: 80.00, description: "GO kart Racing", image_url: "", duration: 60, address: "Las Vegas", included_in_pass: false },
    { title: "KÀ du Cirque du Soleil", cost: 100.00, description: "KÀ by Cirque du Soleil", image_url: "", duration: 90, address: "MGM Grand", included_in_pass: true },
    { title: "Bryce Canyon & Zion", cost: 299.00, description: "Bryce Canyon & Zion National Parks Tour", image_url: "", duration: 720, address: "Utah", included_in_pass: true },
    { title: "Pilotage de GT Sur circuit", cost: 175.00, description: "Pilotage de GT Sur circuit", image_url: "", duration: 120, address: "Speedway", included_in_pass: false },
    { title: "Minus5° Ice Experience", cost: 45.00, description: "Minus5° Ice Experience", image_url: "", duration: 60, address: "Mandalay Bay / Venetian", included_in_pass: true },
    { title: "Real Bodies Museum", cost: 50.00, description: "Real Bodies Museum", image_url: "", duration: 90, address: "Horseshoe Las Vegas", included_in_pass: true }
];

async function populate() {
    console.log(`Starting population of ${activities.length} items...`);
    for (const activity of activities) {
        try {
            const res = await fetch('http://localhost:3000/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activity)
            });
            if (res.ok) {
                console.log(`Added: ${activity.title}`);
            } else {
                console.error(`Failed to add: ${activity.title} - ${res.status}`);
            }
        } catch (error) {
            console.error(`Error adding ${activity.title}:`, error);
        }
    }
    console.log('Population complete.');
}

populate();
