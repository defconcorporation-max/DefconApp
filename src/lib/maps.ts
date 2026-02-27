import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface Business {
    place_id: string;
    name: string;
    address: string;
    phone?: string;
    website?: string;
    types: string[];
    rating?: number;
    user_ratings_total?: number;
    location: {
        lat: number;
        lng: number;
    };
}

export async function searchNearby(
    lat: number,
    lng: number,
    radius: number = 500,
    type: string = 'establishment'
): Promise<Business[]> {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API key is missing');
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    const results: Business[] = [];
    let pageToken: string | undefined;

    do {
        const response = await axios.get(url, {
            params: {
                location: `${lat},${lng}`,
                radius: radius,
                type: type,
                key: GOOGLE_MAPS_API_KEY,
                pagetoken: pageToken,
            },
        });

        const data = response.data;
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('Places API error:', data.status, data.error_message);
            break;
        }

        if (data.results) {
            for (const item of data.results) {
                results.push({
                    place_id: item.place_id,
                    name: item.name,
                    address: item.vicinity,
                    types: item.types,
                    rating: item.rating,
                    user_ratings_total: item.user_ratings_total,
                    location: item.geometry.location,
                });
            }
        }

        pageToken = data.next_page_token;
        if (pageToken) {
            // Google requires a short delay before the next_page_token becomes valid
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    } while (pageToken);

    return results;
}

export async function getPlaceDetails(placeId: string): Promise<Partial<Business>> {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API key is missing');
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json`;
    const response = await axios.get(url, {
        params: {
            place_id: placeId,
            fields: 'formatted_phone_number,website',
            key: GOOGLE_MAPS_API_KEY,
        },
    });

    const data = response.data;
    if (data.status !== 'OK') {
        return {};
    }

    return {
        phone: data.result.formatted_phone_number,
        website: data.result.website,
    };
}

/**
 * Grid Search: Divides an area into a grid of circles to capture more results.
 */
export async function broadAreaSearch(
    centerLat: number,
    centerLng: number,
    totalRadius: number,
    gridStep: number = 1000 // meters (increased for speed and coverage)
): Promise<Business[]> {
    const businesses = new Map<string, Business>();

    const latStep = (gridStep / 111000);
    const lngStep = (gridStep / (111000 * Math.cos(centerLat * Math.PI / 180)));

    // Steps on each side of the center. 
    // For 1000m radius and 1000m gridStep, steps=1 covers a 3x3 grid (3km x 3km).
    const steps = Math.min(Math.ceil(totalRadius / gridStep), 1);

    console.log(`Starting broad search: ${steps * 2 + 1}x${steps * 2 + 1} grid...`);

    const tasks: Promise<Business[]>[] = [];

    for (let i = -steps; i <= steps; i++) {
        for (let j = -steps; j <= steps; j++) {
            const lat = centerLat + i * latStep;
            const lng = centerLng + j * lngStep;
            tasks.push(searchNearby(lat, lng, gridStep));
        }
    }

    const resultsArray = await Promise.all(tasks);

    for (const subResults of resultsArray) {
        for (const b of subResults) {
            if (!businesses.has(b.place_id)) {
                businesses.set(b.place_id, b);
            }
        }
    }

    console.log(`Broad search complete. Found ${businesses.size} unique businesses.`);
    return Array.from(businesses.values());
}
