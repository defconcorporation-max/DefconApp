import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import connectDB from './config/db.js';
import bcrypt from 'bcryptjs';

const resetPassword = async () => {
    await connectDB();
    const newPassword = await bcrypt.hash('admin123', 8);
    await User.findOneAndUpdate({ username: 'admin' }, { password: newPassword });
    console.log('✅ Password for user "admin" has been reset to: admin123');
    process.exit();
};

resetPassword();
