import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

const seedUsers = async () => {
    await connectDB();

    console.log('Cleaning existing users...');
    await User.deleteMany({});

    console.log('Seeding new users...');

    // create Admin
    const adminHash = await bcrypt.hash('admin123', 8);
    await User.create({
        username: 'admin',
        password: adminHash,
        name: 'Admin User',
        role: 'admin'
    });
    console.log('Admin created: admin / admin123');

    // Create Agent Kad
    const kadHash = await bcrypt.hash('kad123', 8);
    await User.create({
        username: 'Kad',
        password: kadHash,
        name: 'Kad',
        role: 'agent'
    });
    console.log('Agent Kad created: Kad / kad123');

    console.log('Migration complete.');
    process.exit();
};

seedUsers();
