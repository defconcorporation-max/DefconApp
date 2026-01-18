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
    pass_url: String, // Main client's unlimited pass
    notes: String,
    preferences: String,
    wishlist: [Number], // Array of Activity IDs
    isArchived: {
        type: Boolean,
        default: false
    },
    travelers: [{
        name: String,
        pass_url: String
    }]
}, {
    timestamps: true
});

const Client = mongoose.model('Client', clientSchema);

export default Client;
