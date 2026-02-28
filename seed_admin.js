const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function seedUser() {
    console.log('🚀 Seeding admin user...');

    const email = 'max@defcon.com';
    const password = 'admin'; // Temporary password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await turso.execute({
            sql: 'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
            args: [email, hashedPassword, 'Max']
        });
        console.log(`✅ User created: ${email} / ${password}`);
    } catch (e) {
        if (e.message.includes('UNIQUE constraint failed')) {
            console.log('ℹ️ User already exists.');
            // Optionally update password if needed
            await turso.execute({ sql: 'UPDATE users SET password_hash = ? WHERE email = ?', args: [hashedPassword, email] });
            console.log('✅ Password reset.');
        } else {
            console.error('❌ Error creating user:', e);
        }
    }
}

seedUser();
