// User roles
export type UserRole = "danisan" | "egitmen" | "admin" | "tabip";

// Appointment states
export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "reminded"
  | "arrived"
  | "treated"
  | "completed"
  | "cancelled"
  | "no_show";

// Payment status
export type PaymentStatus = "paid" | "pending" | "partial" | "free";

// Emergency severity
export type EmergencySeverity = 1 | 2 | 3 | 4 | 5;

// Notification channels
export type NotificationChannel = "sms" | "push" | "email" | "whatsapp" | "telegram";

// GETAT treatment types
export type TreatmentType =
  | "hacamat_kuru"
  | "hacamat_yas"
  | "solucan"
  | "sujok"
  | "refleksoloji"
  | "akupunktur"
  | "fitoterapi"
  | "aromaterapi"
  | "osteopati"
  | "kayropraktik"
  | "diger";

// Base API response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Hijri date
export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
}
