import { Notification } from '../models/Notification.js';

export async function createNotification(payload) {
  return Notification.create(payload);
}

export async function createNotifications(payloads) {
  if (!payloads?.length) return [];
  return Notification.insertMany(payloads);
}
