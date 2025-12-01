import mongoose from 'mongoose';

const itineraryItemSchema = new mongoose.Schema({
    id: Number, // Keeping legacy ID for migration compatibility
    client_id: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['flight', 'hotel', 'activity', 'transport', 'other'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    start_time: {
        type: Date,
        required: true
    },
    end_time: Date,
    location: String,
    details: String,
    image_url: String,
    pass_url: String,
    included_in_pass: {
        type: Boolean,
        default: false
    },
    traveler_passes: [{
        name: String,
        pass_url: String
    }],
    cost: Number
}, {
    timestamps: true
});

const ItineraryItem = mongoose.model('ItineraryItem', itineraryItemSchema);

export default ItineraryItem;
