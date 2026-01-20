import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import connectDB from './config/db.js';
import Client from './models/Client.js';
import ItineraryItem from './models/ItineraryItem.js';
import Activity from './models/Activity.js';
import User from './models/User.js';
import auth from './middleware/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary Storage Setup
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'travel-agency-uploads',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif'],
    },
});

const upload = multer({ storage });

// Routes

// --- Auth Routes ---

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'fallback_secret_key_change_me',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Agent (Admin Only)
app.post('/api/auth/agents', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { username, password, name } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 8);
        const newUser = await User.create({
            username,
            password: hashedPassword,
            name,
            role: 'agent'
        });

        res.json({ id: newUser._id, username: newUser.username, name: newUser.name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Agents (Admin Only)
app.get('/api/auth/agents', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const agents = await User.find({ role: 'agent' }).select('-password');
        res.json(agents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Cloudinary returns the URL in file.path
    res.json({ url: req.file.path });
});

// --- Activity Catalog Routes ---

// Get all activities
app.get('/api/activities', async (req, res) => {
    try {
        const activities = await Activity.find({});
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create activity
app.post('/api/activities', async (req, res) => {
    try {
        const { title, description, image_url, duration, address, cost, included_in_pass } = req.body;
        const newActivity = await Activity.create({
            id: Date.now(), // Legacy ID
            title,
            description,
            image_url,
            duration,
            address,
            cost,
            included_in_pass
        });
        res.json(newActivity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update activity
app.put('/api/activities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedActivity = await Activity.findOneAndUpdate(
            { id: parseInt(id) },
            req.body,
            { new: true }
        );
        if (!updatedActivity) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        res.json(updatedActivity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Client Routes ---

// Get all clients (Filtered by Agent)
app.get('/api/clients', auth, async (req, res) => {
    try {
        let query = {};

        // If agent, only show their clients
        if (req.user.role === 'agent') {
            query = { agent_id: req.user.id };
        }

        const clients = await Client.find(query).populate('agent_id', 'name');
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create client (Auto-Assign Agent)
app.post('/api/clients', auth, async (req, res) => {
    try {
        const { name, email, phone, booking_ref, trip_start, trip_end, pass_url, notes, preferences, travelers } = req.body;

        const newClient = await Client.create({
            id: Date.now(),
            name,
            email,
            phone,
            booking_ref,
            trip_start,
            trip_end,
            pass_url,
            notes,
            preferences,
            travelers: travelers || [],
            agent_id: req.user.id // Assign creator as agent
        });
        res.json({ id: newClient.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update client
app.put('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedClient = await Client.findOneAndUpdate(
            { id: parseInt(id) },
            req.body,
            { new: true }
        );
        if (!updatedClient) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(updatedClient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete client
app.delete('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedClient = await Client.findOneAndDelete({ id: parseInt(id) });

        if (!deletedClient) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Cascade delete: Remove all itinerary items for this client
        await ItineraryItem.deleteMany({ client_id: parseInt(id) });

        res.json({ success: true, message: 'Client and associated data deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get client by ID (Security Check + Itinerary)
app.get('/api/clients/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const client = await Client.findOne({ id: parseInt(id) });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Data Isolation Check: If agent, ensure they own the client
        if (req.user.role === 'agent' && client.agent_id && client.agent_id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied: You do not own this client' });
        }

        const itinerary = await ItineraryItem.find({ client_id: parseInt(id) }).sort({ start_time: 1 });

        // Convert Mongoose document to object to spread
        res.json({ ...client.toObject(), itinerary });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get ALL itineraries (for analytics)
app.get('/api/itineraries', async (req, res) => {
    try {
        const itineraries = await ItineraryItem.find({});
        res.json(itineraries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Itinerary Routes ---

// Get itinerary for a client
app.get('/api/itinerary/:client_id', async (req, res) => {
    try {
        const { client_id } = req.params;
        const itinerary = await ItineraryItem.find({ client_id: parseInt(client_id) }).sort({ start_time: 1 });
        res.json(itinerary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add itinerary item
app.post('/api/itinerary', async (req, res) => {
    try {
        const { client_id, type, title, description, start_time, end_time, location, details, image_url, pass_url, included_in_pass, traveler_passes, is_flexible, cost } = req.body;
        const newItem = await ItineraryItem.create({
            id: Date.now(),
            client_id: parseInt(client_id),
            type,
            title,
            description,
            start_time,
            end_time,
            location,
            details,
            image_url,
            pass_url,
            included_in_pass: included_in_pass || false,
            traveler_passes: traveler_passes || [],
            is_flexible: is_flexible || false,
            cost: cost ? parseFloat(cost) : 0,
            costPrice: req.body.costPrice ? parseFloat(req.body.costPrice) : 0,
            serviceFee: req.body.serviceFee ? parseFloat(req.body.serviceFee) : 0,
            commissionType: req.body.commissionType || 'percent',
            commissionValue: req.body.commissionValue ? parseFloat(req.body.commissionValue) : 0,
            peopleCount: req.body.peopleCount ? parseInt(req.body.peopleCount) : 1,
            isPremium: req.body.isPremium || false
        });
        res.json({ id: newItem.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update itinerary item
app.put('/api/itinerary/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedItem = await ItineraryItem.findOneAndUpdate(
            { id: parseInt(id) },
            req.body,
            { new: true }
        );
        if (!updatedItem) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete itinerary item
app.delete('/api/itinerary/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedItem = await ItineraryItem.findOneAndDelete({ id: parseInt(id) });
        if (!deletedItem) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export for Vercel
export default app;

// Only listen if not running on Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
