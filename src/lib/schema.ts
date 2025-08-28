import { integer, text, sqliteTable } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  role: text('role', { enum: ['admin', 'client', 'user'] }).notNull(),
  initials: text('initials').notNull(),
  password: text('password').notNull(),
  newProjectNotifications: integer('new_project_notifications', { mode: 'boolean' }).default(true),
  paymentSuccessNotifications: integer('payment_success_notifications', { mode: 'boolean' }).default(true),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  clientId: text('client_id').notNull().references(() => users.id),
  clientName: text('client_name').notNull(),
  previewVideoUrl: text('preview_video_url').notNull(),
  finalVideoUrl: text('final_video_url').notNull(),
  expiryDate: text('expiry_date').notNull(),
  paymentStatus: text('payment_status', { enum: ['pending', 'paid', 'overdue'] }).notNull(),
  orderId: text('order_id').notNull(),
  createdAt: text('created_at').notNull(),
  amount: integer('amount').notNull(),
});

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  company: text('company'),
  createdAt: text('created_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value'),
});
