import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: String,
    message: String,
    type: String,
    date: Date,
    seen: Boolean,
    user_id: String,
});

export const Notification =mongoose.models.notifications || mongoose.model('notifications', notificationSchema);