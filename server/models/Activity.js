import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    id: Number, // Keeping legacy ID for migration compatibility
    title: {
        type: String,
        required: true
    },
    description: String,
    image_url: String,
    duration: String,
    address: String,
    cost: Number,
    included_in_pass: Boolean
}, {
    timestamps: true
});

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
