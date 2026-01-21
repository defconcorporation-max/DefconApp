import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import connectDB from './config/db.js';

const listUsers = async () => {
    await connectDB();
    const users = await User.find({}, 'username role name');
    console.log('--- REGISTERED USERS ---');
    console.table(users.map(u => ({ id: u._id.toString(), username: u.username, role: u.role, name: u.name })));
    process.exit();
};

listUsers();
