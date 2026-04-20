import { Notification } from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function serializeNotification(notification) {
  return {
    id: notification._id,
    user: notification.user,
    type: notification.type,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt
  };
}

export async function createNotification({ userId, type, message }) {
  if (!userId || !type || !message) {
    return null;
  }

  return Notification.create({
    user: userId,
    type,
    message
  });
}

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  res.json({
    notifications: notifications.map(serializeNotification),
    unreadCount
  });
});

export const markNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    {
      user: req.user._id,
      isRead: false
    },
    {
      $set: { isRead: true }
    }
  );

  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);

  res.json({
    message: "Notifications marked as read",
    notifications: notifications.map(serializeNotification),
    unreadCount: 0
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false
  });

  res.json({
    message: "Notification marked as read",
    notification: serializeNotification(notification),
    unreadCount
  });
});

export const clearNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });

  res.json({
    message: "Notifications cleared",
    notifications: [],
    unreadCount: 0
  });
});
