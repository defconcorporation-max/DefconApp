import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    id: Number, // Keeping legacy ID for migration compatibility
    name: {
        type: String,
        required: true
    },
    email: String,
    phone: String,
    booking_ref: String,
    trip_start: Date,
    trip_end: Date,
    notes: String,
    preferences: String,
    wishlist: [Number] // Array of Activity IDs
}, {
    timestamps: true
});

const Client = mongoose.model('Client', clientSchema);

export default Client;
