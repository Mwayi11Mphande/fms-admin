import { z } from 'zod';

export const NotificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(), // Can be specific user or broadcast
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(['info', 'warning', 'alert', 'maintenance', 'scheduling', 'system']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  relatedTo: z.object({
    type: z.enum(['vehicle', 'driver', 'maintenance', 'fuel', 'schedule', 'tracking', 'system']),
    id: z.string().optional(),
  }).optional(),
  status: z.enum(['unread', 'read', 'archived']).default('unread'),
  readAt: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
  actionUrl: z.string().optional(),
//   metadata: z.record(z.any()).optional(),
  createdAt: z.date().default(() => new Date()),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const AlertRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(['speed', 'geofence', 'maintenance', 'fuel', 'idle_time', 'vehicle_status']),
  condition: z.object({
    operator: z.enum(['>', '<', '=', '>=', '<=', 'between', 'enters', 'exits']),
    value: z.union([z.number(), z.string(), z.array(z.any())]),
    unit: z.string().optional(),
    duration: z.number().optional(), // For time-based conditions
  }),
  target: z.object({
    vehicles: z.array(z.string()).optional(),
    drivers: z.array(z.string()).optional(),
    all: z.boolean().default(false),
  }),
  notification: z.object({
    title: z.string(),
    message: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    channels: z.array(z.enum(['in_app', 'email', 'sms', 'push'])).default(['in_app']),
    recipients: z.array(z.string()).optional(), // User IDs or emails
  }),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type AlertRule = z.infer<typeof AlertRuleSchema>;