
import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    id: { type: Number, required: true }, // Legacy ID or Timestamp
    agent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String, // 'Marketing', 'Software', 'Travel', 'Commission', 'Other'
        default: 'Other'
    },
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },
    date: { // Date of unexpectedness/invoice
        type: Date,
        default: Date.now
    },
    due_date: { // Deadline for payment
        type: Date
    },
    notes: String,
    invoice_url: String
}, {
    timestamps: true
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
