/*eslint-disable @typescript-eslint/no-explicit-any*/
import { Timestamp } from "firebase/firestore";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { DataTypeReturn as TypeReturn } from "../types/index"

export function normalizeFirestoreData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => {
      if (value instanceof Timestamp) {
        return value.toDate().toISOString(); // or value.toMillis()
      }
      return value;
    })
  );
}

export const retainer = async <T>(
  response: TypeReturn<T>
): Promise<TypeReturn<T>> => {
  switch (response?.status) {
    case "success":
    case "warning":
      const { message, status, data } = response;
      return {
        status,
        message,
        data,
      };
    case "error":
      const { message: m, status: s } = response;

      return {
        status: s,
        message: m,
      };

    default:
      return {
        status: "error",
        message: "Unable to Search User",
      };
  }
};

export const capitalizeFirstLetter = (word: string) => {
  if (!word) return ''
  return word.charAt(0).toLocaleUpperCase() + word.slice(1)
}

export function trimAndEllipsis(text: string, maxLength = 50): string {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

export function isEmpty(value: unknown): boolean {
  if (value == null) return true; // null or undefined
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

export type DateInput = Date | string | number | Timestamp | null | undefined;
type FirestoreTimestampLike = { _seconds: number; _nanoseconds: number };
type TimeUnit =
  | "year"
  | "month"
  | "week"
  | "day"
  | "hour"
  | "minute"
  | "second";

interface DateUtils {
  formatDateLong(date?: DateInput): string;
  formatDateShort(date?: DateInput): string;
  formatFull(date?: DateInput): string;
  timeAgo(date: DateInput): string;
  startOfToday(): Date;
  endOfToday(): Date;
  shiftDays(date?: DateInput, days?: number): Date;
  now(): number;
  getYearsAgoDate(yearsAgo?: number): string;
  formatDate(date: unknown): string;
}

/**
 * Strictly parse supported date inputs
 */
const parseDate = (date: DateInput): Date => {
  if (!date) throw new Error("Date is null/undefined");

  if (date instanceof Date) {
    if (isNaN(date.getTime())) throw new Error("Invalid Date object");
    return date;
  }

  if (typeof date === "string" || typeof date === "number") {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string/number: ${date}`);
    }
    return parsed;
  }

  if (date instanceof Timestamp) {
    return date.toDate();
  }

  throw new Error(`Unsupported date input: ${date}`);
};

export const dateUtils: DateUtils = {
  formatDateLong(date: DateInput = new Date()): string {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(parseDate(date));
  },

  formatDateShort(date: DateInput = new Date()): string {
    return new Intl.DateTimeFormat("en-US").format(parseDate(date));
  },

  formatFull(date: DateInput = new Date()): string {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(parseDate(date));
  },

  timeAgo(date: DateInput): string {
    const now = new Date();
    const targetDate = parseDate(date);
    const seconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

    const ranges: Record<TimeUnit, number> = {
      year: 31536000,
      month: 2628000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1,
    };

    for (const [unit, secondsInUnit] of Object.entries(ranges) as [
      TimeUnit,
      number
    ][]) {
      if (seconds >= secondsInUnit || unit === "second") {
        const value = -Math.floor(seconds / secondsInUnit);
        return rtf.format(value, unit);
      }
    }

    return rtf.format(0, "second");
  },

  startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  },

  endOfToday(): Date {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  },

  shiftDays(date: DateInput = new Date(), days: number = 1): Date {
    const d = new Date(parseDate(date));
    d.setDate(d.getDate() + days);
    return d;
  },

  now(): number {
    return Date.now();
  },

  getYearsAgoDate(yearsAgo: number = 0): string {
    const today = new Date();
    const past = new Date(
      today.getFullYear() - yearsAgo,
      today.getMonth(),
      today.getDate()
    );
    return past.toISOString().split("T")[0];
  },
  formatDate(date: unknown): string {
    const jsDate = toDate(date);
    if (!jsDate) return "Invalid date";
    return dateUtils.formatDateLong(jsDate);
  },
};

const toDate = (date: unknown): Date | null => {
  if (!date) return null;

  // Firestore Timestamp-like
  if (
    typeof date === "object" &&
    date !== null &&
    "_seconds" in date &&
    "_nanoseconds" in date
  ) {
    const { _seconds, _nanoseconds } = date as FirestoreTimestampLike;
    return new Date(_seconds * 1000 + _nanoseconds / 1e6);
  }

  // Already a Date
  if (date instanceof Date) return date;

  // String input
  if (typeof date === "string") {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

export const showData = (data: unknown) => { console.log(data) }

// ===== NEW FUNCTIONS ADDED BELOW =====

// Helper function to safely convert any date-like object to Date
export const safeToDate = (dateInput: Date | { toDate: () => Date } | string | undefined): Date | null => {
  if (!dateInput) return null;
  
  try {
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    
    // Handle Firestore Timestamp
    if (typeof dateInput === 'object' && dateInput !== null && 'toDate' in dateInput) {
      const date = (dateInput as any).toDate();
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Handle string
    if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  } catch (error) {
    console.error('Error converting to date:', error);
    return null;
  }
};

// Helper function to safely format dates (using your existing dateUtils)
export const formatDateSafe = (dateInput: Date | { toDate: () => Date } | string | undefined, formatStr: string = "MMM dd, yyyy"): string => {
  const date = safeToDate(dateInput);
  if (!date) return "Not specified";
  
  try {
    // Use your existing dateUtils.formatDate function
    return dateUtils.formatDate(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return "Invalid date";
  }
};

// Alternative simple format function
export const simpleFormatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "Not specified";
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return "Invalid date";
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return "Invalid date";
  }
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if the number is valid
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

// Generate initials from name
export const getInitials = (name: string): string => {
  if (!name) return "";
  
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Calculate age from date
export const calculateAge = (birthDate: Date | string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate URL
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

// Generate random ID
export const generateId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Convert object to query string
export const objectToQueryString = (obj: Record<string, any>): string => {
  return Object.keys(obj)
    .filter(key => obj[key] !== undefined && obj[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
};

// Parse query string to object
export const queryStringToObject = (queryString: string): Record<string, string> => {
  return Object.fromEntries(new URLSearchParams(queryString));
};

// Sleep function
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Format vehicle type for display
export const formatVehicleType = (type: string): string => {
  const typeMap: Record<string, string> = {
    car: "Car",
    truck: "Truck",
    van: "Van",
    suv: "SUV",
    motorcycle: "Motorcycle",
    bus: "Bus",
  };
  
  return typeMap[type] || capitalizeFirstLetter(type);
};

// Format fuel type for display
export const formatFuelType = (fuelType: string): string => {
  const fuelMap: Record<string, string> = {
    gasoline: "Gasoline",
    diesel: "Diesel",
    electric: "Electric",
    hybrid: "Hybrid",
    cng: "CNG",
    petrol: "Petrol",
  };
  
  return fuelMap[fuelType] || capitalizeFirstLetter(fuelType);
};

// Format vehicle status for display
export const formatVehicleStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    available: "Available",
    in_use: "In Use",
    maintenance: "Maintenance",
    out_of_service: "Out of Service",
    active: "Active",
    inactive: "Inactive",
    on_leave: "On Leave",
    terminated: "Terminated",
  };
  
  return statusMap[status] || capitalizeFirstLetter(status);
};

// Get status color class
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    available: "bg-green-100 text-green-800 border-green-200",
    in_use: "bg-blue-100 text-blue-800 border-blue-200",
    maintenance: "bg-amber-100 text-amber-800 border-amber-200",
    out_of_service: "bg-red-100 text-red-800 border-red-200",
    active: "bg-green-100 text-green-800 border-green-200",
    inactive: "bg-gray-100 text-gray-800 border-gray-200",
    on_leave: "bg-blue-100 text-blue-800 border-blue-200",
    terminated: "bg-red-100 text-red-800 border-red-200",
  };
  
  return statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200";
};

// Get vehicle type icon
export const getVehicleTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    car: "🚗",
    truck: "🚚",
    van: "🚐",
    suv: "🚙",
    motorcycle: "🏍️",
    bus: "🚌",
  };
  
  return iconMap[type] || "🚗";
};

// Calculate maintenance due date
export const calculateNextMaintenance = (lastMaintenance: Date | string, intervalDays: number = 90): Date => {
  const lastDate = new Date(lastMaintenance);
  const nextDate = new Date(lastDate);
  nextDate.setDate(lastDate.getDate() + intervalDays);
  return nextDate;
};

// Check if maintenance is due
export const isMaintenanceDue = (lastMaintenance: Date | string, intervalDays: number = 90): boolean => {
  const nextMaintenance = calculateNextMaintenance(lastMaintenance, intervalDays);
  const today = new Date();
  return today >= nextMaintenance;
};

// Calculate days until maintenance
export const daysUntilMaintenance = (lastMaintenance: Date | string, intervalDays: number = 90): number => {
  const nextMaintenance = calculateNextMaintenance(lastMaintenance, intervalDays);
  const today = new Date();
  const diffTime = nextMaintenance.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Format mileage
export const formatMileage = (mileage: number): string => {
  return mileage.toLocaleString() + " km";
};

// Calculate fuel efficiency
export const calculateFuelEfficiency = (distance: number, fuelUsed: number): string => {
  if (fuelUsed === 0) return "0 km/L";
  const efficiency = distance / fuelUsed;
  return `${efficiency.toFixed(1)} km/L`;
};