import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: String,
    message: String,
    type: String,
    date: {
        type: Date,
        default: Date.now, 
        index: { expires: 86400 } // 24h in seconds (60*60*24)
    },
    seen: Boolean,
    user_id: String,
});

export const Notification =mongoose.models.notifications || mongoose.model('notifications', notificationSchema);