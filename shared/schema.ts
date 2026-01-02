import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Password validation schema for tutors
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(20, "Password must be at most 20 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one symbol");

// Users table - for authentication via Supabase
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
});

// Contact submissions table - stores messages from contact form
export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tutor profiles table - stores tutor information
export const tutorProfiles = pgTable("tutor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supabaseUserId: text("supabase_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // For email/password login (password = email)
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  photoUrl: text("photo_url"),
  subjects: text("subjects").array(),
  hourlyRate: integer("hourly_rate").default(200),
  googleMeetUrl: text("google_meet_url"),
  bio: text("bio"),
  isApproved: boolean("is_approved").default(false),
  isBlocked: boolean("is_blocked").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tutor availability table - days when tutor is available
export const tutorAvailability = pgTable("tutor_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tutorId: varchar("tutor_id").notNull(),
  day: text("day").notNull(),
  date: text("date"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  notes: text("notes"),
  isBooked: boolean("is_booked").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pricing table - for dynamic session pricing
export const pricing = pgTable("pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hours: integer("hours").notNull(),
  amount: integer("amount").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Booking payments table - tracks student payments for sessions
export const bookingPayments = pgTable("booking_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email").notNull(),
  studentPhone: text("student_phone"),
  tutorId: varchar("tutor_id").notNull(),
  availabilityId: varchar("availability_id"),
  hours: integer("hours").default(1).notNull(),
  amount: integer("amount").notNull(),
  paymentStatus: text("payment_status").default("pending").notNull(),
  yocoCheckoutId: text("yoco_checkout_id"),
  meetingLink: text("meeting_link"),
  subject: text("subject"),
  sessionStartTime: timestamp("session_start_time"),
  sessionEndTime: timestamp("session_end_time"),
  isActive: boolean("is_active").default(true),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Appointments table - stores booking requests
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email").notNull(),
  studentPhone: text("student_phone").notNull(),
  subject: text("subject").notNull(),
  preferredDate: text("preferred_date").notNull(),
  preferredTime: text("preferred_time").notNull(),
  message: text("message"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment links table - stores Yoco payment URLs
export const paymentLinks = pgTable("payment_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(),
  hours: integer("hours").notNull(),
  amount: integer("amount").notNull(),
  url: text("url").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Admin settings table - stores admin credentials (hashed)
export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Action logs table - tracks all important actions
export const actionLogs = pgTable("action_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actionType: text("action_type").notNull(), // 'booking_created', 'payment_clicked', 'slot_added', 'slot_removed', 'tutor_approved', etc.
  description: text("description").notNull(),
  userId: text("user_id"), // can be student email or admin username
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat messages table - for real-time messaging between students and tutors
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(), // Unique ID for each student-tutor pair
  senderType: text("sender_type").notNull(), // 'student' or 'tutor'
  senderEmail: text("sender_email").notNull(),
  senderName: text("sender_name").notNull(),
  receiverEmail: text("receiver_email").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat conversations table - tracks unique conversations between students and tutors
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentEmail: text("student_email").notNull(),
  studentName: text("student_name").notNull(),
  tutorId: varchar("tutor_id").notNull(),
  tutorEmail: text("tutor_email").notNull(),
  tutorName: text("tutor_name").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertContactSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const insertAvailabilitySchema = createInsertSchema(tutorAvailability).omit({
  id: true,
  createdAt: true,
  isBooked: true,
}).extend({
  tutorId: z.string().min(1, "Tutor ID is required"),
  day: z.string().min(1, "Please select a day"),
  date: z.string().optional(),
  startTime: z.string().min(1, "Please select start time"),
  endTime: z.string().min(1, "Please select end time"),
  notes: z.string().optional(),
});

export const insertTutorProfileSchema = createInsertSchema(tutorProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isApproved: true,
  isBlocked: true,
}).extend({
  supabaseUserId: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  subjects: z.array(z.string()).optional().nullable(),
  hourlyRate: z.number().min(0).optional().nullable(),
  googleMeetUrl: z.string().url("Invalid Google Meet URL").optional().or(z.literal("")).nullable(),
  bio: z.string().optional().nullable(),
});

export const insertPricingSchema = createInsertSchema(pricing).omit({
  id: true,
  createdAt: true,
}).extend({
  hours: z.number().min(1, "Hours must be at least 1"),
  amount: z.number().min(0, "Amount must be positive"),
  isActive: z.boolean().optional(),
});

export const insertBookingPaymentSchema = createInsertSchema(bookingPayments).omit({
  id: true,
  createdAt: true,
  isActive: true,
  reminderSent: true,
}).extend({
  studentName: z.string().min(2, "Name must be at least 2 characters"),
  studentEmail: z.string().email("Invalid email address"),
  studentPhone: z.string().optional().nullable(),
  tutorId: z.string().min(1, "Tutor ID is required"),
  availabilityId: z.string().optional().nullable(),
  hours: z.number().min(1).optional(),
  amount: z.number().min(0),
  paymentStatus: z.string().optional(),
  yocoCheckoutId: z.string().optional().nullable(),
  meetingLink: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  sessionStartTime: z.date().optional().nullable(),
  sessionEndTime: z.date().optional().nullable(),
});

export const tutorSignUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const tutorSignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  status: true,
  createdAt: true,
}).extend({
  studentName: z.string().min(2, "Name must be at least 2 characters"),
  studentEmail: z.string().email("Invalid email address"),
  studentPhone: z.string().min(10, "Phone must be at least 10 characters"),
  subject: z.string().min(1, "Please select a subject"),
  preferredDate: z.string().min(1, "Please select a date"),
  preferredTime: z.string().min(1, "Please select a time"),
  message: z.string().optional(),
});

export type InsertContactSubmission = z.infer<typeof insertContactSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Availability = typeof tutorAvailability.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type User = typeof users.$inferSelect;

export type InsertTutorProfile = z.infer<typeof insertTutorProfileSchema>;
export type TutorProfile = typeof tutorProfiles.$inferSelect;
export type InsertPricing = z.infer<typeof insertPricingSchema>;
export type Pricing = typeof pricing.$inferSelect;
export type InsertBookingPayment = z.infer<typeof insertBookingPaymentSchema>;
export type BookingPayment = typeof bookingPayments.$inferSelect;
export type TutorSignUp = z.infer<typeof tutorSignUpSchema>;
export type TutorSignIn = z.infer<typeof tutorSignInSchema>;

// Payment link types
export type PaymentLink = typeof paymentLinks.$inferSelect;
export type InsertPaymentLink = {
  subject: string;
  hours: number;
  amount: number;
  url: string;
  isActive?: boolean;
};

// Admin settings types
export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertAdminSettings = {
  username: string;
  passwordHash: string;
};

// Action log types
export type ActionLog = typeof actionLogs.$inferSelect;
export type InsertActionLog = {
  actionType: string;
  description: string;
  userId?: string | null;
  metadata?: string | null;
};

// Chat message schemas and types
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  isRead: true,
}).extend({
  conversationId: z.string().min(1, "Conversation ID is required"),
  senderType: z.enum(["student", "tutor"]),
  senderEmail: z.string().email("Invalid sender email"),
  senderName: z.string().min(1, "Sender name is required"),
  receiverEmail: z.string().email("Invalid receiver email"),
  message: z.string().min(1, "Message cannot be empty"),
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
}).extend({
  studentEmail: z.string().email("Invalid student email"),
  studentName: z.string().min(1, "Student name is required"),
  tutorId: z.string().min(1, "Tutor ID is required"),
  tutorEmail: z.string().email("Invalid tutor email"),
  tutorName: z.string().min(1, "Tutor name is required"),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
