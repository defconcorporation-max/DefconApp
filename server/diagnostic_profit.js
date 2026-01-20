
import mongoose from 'mongoose';
import ItineraryItem from './models/ItineraryItem.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-agency');
        console.log('Connected to DB');

        const items = await ItineraryItem.find({});
        console.log(`Found ${items.length} items.`);

        let totalProfit = 0;
        let totalRevenue = 0;

        items.forEach((item, index) => {
            const revenue = (item.cost || 0) + (item.serviceFee || 0);
            const netCost = (item.costPrice || 0);

            // Replicate server logic
            const base = item.type === 'service_fee' ? (item.serviceFee || 0) : (item.cost || 0);
            let comm = 0;
            if (item.commissionType === 'fixed') {
                comm = (item.commissionValue || 0);
            } else {
                comm = base * ((item.commissionValue || 0) / 100);
            }

            const profit = (revenue - netCost) - comm;
            totalProfit += profit;
            totalRevenue += revenue;

            if (index < 5) {
                console.log(`Item ${item.id} (${item.type}): Rev=${revenue}, Net=${netCost}, Comm=${comm}, Profit=${profit}`);
            }
        });

        console.log('------------------');
        console.log('Total Revenue:', totalRevenue);
        console.log('Total Profit:', totalProfit);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
