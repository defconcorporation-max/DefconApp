
import mongoose from 'mongoose';
import Client from './models/Client.js';
import User from './models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-agency';

const inspectData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const clients = await Client.find({});
        console.log(`Found ${clients.length} clients`);

        clients.forEach(c => {
            console.log(`Client: ${c.name} | ID: ${c.id} | AgentID: ${c.agent_id} (${c.agent_id ? typeof c.agent_id : 'missing'})`);
        });

        const users = await User.find({});
        console.log(`Found ${users.length} users`);
        users.forEach(u => {
            console.log(`User: ${u.username} | Role: ${u.role} | ID: ${u._id}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

inspectData();
