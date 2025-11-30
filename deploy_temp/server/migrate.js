import { JSONFilePreset } from 'lowdb/node';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Client from './models/Client.js';
import ItineraryItem from './models/ItineraryItem.js';
import Activity from './models/Activity.js';

dotenv.config();

const migrateData = async () => {
    try {
        // 1. Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // 2. Read from db.json
        console.log('Reading db.json...');
        const defaultData = { clients: [], itineraries: [], activities: [] };
        const db = await JSONFilePreset('db.json', defaultData);
        await db.read();
        const { clients, itineraries, activities } = db.data;

        // 3. Clear existing MongoDB data (Optional - be careful!)
        // await Client.deleteMany({});
        // await ItineraryItem.deleteMany({});
        // await Activity.deleteMany({});

        // 4. Insert Data
        if (clients && clients.length > 0) {
            console.log(`Migrating ${clients.length} clients...`);
            const processedClients = clients.map(client => ({
                ...client,
                wishlist: Array.isArray(client.wishlist)
                    ? client.wishlist.map(item => (typeof item === 'object' ? item.id : item))
                    : []
            }));
            await Client.insertMany(processedClients);
        }

        if (itineraries && itineraries.length > 0) {
            console.log(`Migrating ${itineraries.length} itinerary items...`);
            const processedItineraries = itineraries.map(item => ({
                ...item,
                details: typeof item.details === 'object' ? JSON.stringify(item.details) : item.details
            }));
            await ItineraryItem.insertMany(processedItineraries);
        }

        if (activities && activities.length > 0) {
            console.log(`Migrating ${activities.length} activities...`);
            await Activity.insertMany(activities);
        }

        console.log('Migration completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateData();
