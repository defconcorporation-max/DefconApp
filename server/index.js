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
import mongoose from 'mongoose';

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

// Get Global Admin Stats (Total Profit)
app.get('/api/admin/stats', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const itineraries = await ItineraryItem.find({});
        let totalProfit = 0;
        let totalRevenue = 0;
        let totalCommission = 0;
        const currentYear = new Date().getFullYear();
        const monthlyStats = {};
        const monthlyCommissionStats = {};

        // Initialize months
        for (let i = 1; i <= 12; i++) {
            const key = `${currentYear}-${String(i).padStart(2, '0')}`;
            monthlyStats[key] = 0;
            monthlyCommissionStats[key] = 0;
        }

        itineraries.forEach(item => {
            // Commission Calculation
            const base = item.type === 'service_fee' ? (item.serviceFee || 0) : (item.cost || 0); // Sell Price
            let comm = 0;
            if (item.commissionType === 'fixed') {
                comm = (item.commissionValue || 0);
            } else {
                comm = base * ((item.commissionValue || 0) / 100);
            }

            // Profit = (Sell Price - Net Price) + Service Fees - Commission
            // Sell Price (Revenue) = item.cost + item.serviceFee
            // Net Cost = item.costPrice
            // Profit = (Revenue - Net Cost) - Commission

            const revenue = (item.cost || 0) + (item.serviceFee || 0);
            const netCost = (item.costPrice || 0);
            const profit = (revenue - netCost) - comm;

            totalProfit += profit;
            totalRevenue += revenue;
            totalCommission += comm;

            // Monthly breakdown (Current Year)
            if (item.start_time) {
                const date = new Date(item.start_time);
                if (date.getFullYear() === currentYear) {
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if (monthlyStats.hasOwnProperty(monthKey)) {
                        monthlyStats[monthKey] += revenue;
                        monthlyCommissionStats[monthKey] += comm;
                    }
                }
            }
        });

        const sortedMonths = Object.keys(monthlyStats).sort();
        const monthlyRevenue = sortedMonths.map(key => ({
            month: key,
            revenue: monthlyStats[key],
            commission: monthlyCommissionStats[key] || 0
        }));

        res.json({ title: "Global Stats", totalProfit, totalRevenue, totalCommission, monthlyRevenue });
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

// Get specific agent details with stats (Admin or Self)
app.get('/api/agents/:id/details', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Allow if admin OR if the requesting user's ID matches the requested ID
        if (req.user.role !== 'admin' && req.user.userId !== id && req.user._id?.toString() !== id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const agent = await User.findById(id).select('-password');

        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        const clients = await Client.find({ agent_id: id });

        // Stats Calculation
        const activeClients = clients.length;
        const upcomingTrips = clients.filter(c => c.trip_start && new Date(c.trip_start) > new Date()).length;

        // Fetch Itineraries for detailed financial stats
        // This might be heavy if many clients, but necessary for accurate totals
        const clientLegacyIds = clients.map(c => c.id).filter(Boolean); // Filter out any without legacy ID if mixed
        const itineraries = await ItineraryItem.find({ client_id: { $in: clientLegacyIds } });

        let totalRevenue = 0;
        let totalCommission = 0;
        const currentYear = new Date().getFullYear();
        const monthlyStats = {};
        const monthlyCommissionStats = {};

        // Initialize all 12 months for Current Year to ensure Jan-Dec sorting
        for (let i = 1; i <= 12; i++) {
            const key = `${currentYear}-${String(i).padStart(2, '0')}`;
            monthlyStats[key] = 0;
            monthlyCommissionStats[key] = 0;
        }

        itineraries.forEach(item => {
            // Revenue = Cost (Selling Price) + Service Fees
            const sales = (item.cost || 0) + (item.serviceFee || 0);
            totalRevenue += sales;

            // Commission Calculation (Matching ClientDetails.jsx)
            const base = item.type === 'service_fee' ? (item.serviceFee || 0) : (item.cost || 0);

            let comm = 0;
            if (item.commissionType === 'fixed') {
                comm = (item.commissionValue || 0);
            } else {
                // Percent of Base (Selling Price)
                comm = base * ((item.commissionValue || 0) / 100);
            }

            totalCommission += comm;

            // Monthly breakdown (Current Year Only)
            if (item.start_time) {
                const date = new Date(item.start_time);
                if (date.getFullYear() === currentYear) {
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                    if (monthlyStats.hasOwnProperty(monthKey)) {
                        monthlyStats[monthKey] += sales;
                        monthlyCommissionStats[monthKey] += comm;
                    }
                }
            }
        });

        // Convert monthlyStats to array
        const sortedMonths = Object.keys(monthlyStats).sort();
        const monthlyRevenue = sortedMonths.map(key => ({
            month: key,
            revenue: monthlyStats[key],
            commission: monthlyCommissionStats[key] || 0
        }));

        res.json({
            agent,
            clients,
            stats: {
                activeClients,
                upcomingTrips,
                totalRevenue,
                totalCommission,
                monthlyRevenue
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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
        console.log(`[DEBUG] GET /clients/${id} by ${req.user.username} (${req.user.role})`);

        let query = {};
        if (mongoose.isValidObjectId(id)) {
            query = { _id: id };
        } else {
            query = { id: parseInt(id) };
        }

        const client = await Client.findOne(query);
        console.log(`[DEBUG] Client found: ${!!client}, ID Checked: ${JSON.stringify(query)}`);

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        if (req.user.role === 'agent' && client.agent_id && client.agent_id.toString() !== req.user.id) {
            console.log(`[DEBUG] Access DENIED. Client Owner: ${client.agent_id}, Requesting User: ${req.user.id}`);
            return res.status(403).json({ error: 'Access denied: You do not own this client' });
        }

        const itinerary = await ItineraryItem.find({ client_id: parseInt(id) }).sort({ start_time: 1 });

        // Convert Mongoose document to object to spread
        res.json({ ...client.toObject(), itinerary });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Public Client View (No Auth)
app.get('/api/public/client/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let query = {};
        if (mongoose.isValidObjectId(id)) {
            query = { _id: id };
        } else {
            query = { id: parseInt(id) };
        }

        const client = await Client.findOne(query);

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const itinerary = await ItineraryItem.find({ client_id: client.id }).sort({ start_time: 1 });
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
        let numericId = parseInt(client_id);

        // If it's an ObjectId, we need to find the client first to get the numeric ID
        if (mongoose.isValidObjectId(client_id)) {
            const client = await Client.findOne({ _id: client_id });
            if (client) numericId = client.id;
        }

        const itinerary = await ItineraryItem.find({ client_id: numericId }).sort({ start_time: 1 });
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

// --- Expense Routes ---

import Expense from './models/Expense.js';

// Get Expenses
app.get('/api/expenses', auth, async (req, res) => {
    try {
        // Agents see only their own. Admins see all? 
        // User said "only agent side", so let's stick to agent scope for now.
        // If Admin wants to verify expenses, we can add that logic later.
        let query = { agent_id: req.user.id };
        if (req.user.role === 'admin') {
            // Optional: Admin can see all or filter? Let's show all for Admin for now or filter by query
            if (req.query.agent_id) query = { agent_id: req.query.agent_id };
            else query = {}; // Admin sees all
        }

        const expenses = await Expense.find(query).sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Expense
app.post('/api/expenses', auth, async (req, res) => {
    try {
        const { title, amount, category, status, date, due_date, notes, agent_id } = req.body;

        // Determine target agent ID:
        // If Admin and agent_id is provided, use it. Otherwise, use requester's ID.
        const targetAgentId = (req.user.role === 'admin' && agent_id) ? agent_id : req.user.id;

        const newExpense = await Expense.create({
            id: Date.now(),
            agent_id: targetAgentId,
            title,
            amount,
            category,
            status: status || 'pending',
            date: date || new Date(),
            due_date,
            notes
        });
        res.json(newExpense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Expense
app.put('/api/expenses/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const query = { _id: id };

        // Security: Ensure agent owns it (unless admin)
        if (req.user.role !== 'admin') {
            query.agent_id = req.user.id;
        }

        const updatedExpense = await Expense.findOneAndUpdate(
            query,
            req.body,
            { new: true }
        );

        if (!updatedExpense) {
            return res.status(404).json({ error: 'Expense not found or unauthorized' });
        }
        res.json(updatedExpense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Expense
app.delete('/api/expenses/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const query = { _id: id };

        if (req.user.role !== 'admin') {
            query.agent_id = req.user.id;
        }

        const deleted = await Expense.findOneAndDelete(query);
        if (!deleted) {
            return res.status(404).json({ error: 'Expense not found or unauthorized' });
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
