import { z } from "zod";

export const userSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  
  email: z.string()
    .email("Please enter a valid email address"),
  
  phone: z.string()
    .regex(/^\+?[\d\s-]{10,}$/, "Please enter a valid phone number"),
  
  role: z.enum(["admin", "manager", "dispatcher", "driver", "viewer"]),
  
  status: z.enum(["active", "inactive", "pending"]).default("pending"),
  
  sendInvite: z.boolean().default(true),
});

export const profileSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  
  email: z.string().email("Please enter a valid email address"),
  
  phone: z.string()
    .regex(/^\+?[\d\s-]{10,}$/, "Please enter a valid phone number"),
  
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type UserFormData = z.infer<typeof userSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;