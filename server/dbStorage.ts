import { db } from './db';
import { eq, lt, and, isNull, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { desc } from 'drizzle-orm';
import {
  contactSubmissions,
  appointments,
  tutorAvailability,
  tutorProfiles,
  pricing,
  bookingPayments,
  paymentLinks,
  adminSettings,
  actionLogs,
  chatMessages,
  chatConversations,
  type ContactSubmission,
  type InsertContactSubmission,
  type Appointment,
  type InsertAppointment,
  type Availability,
  type InsertAvailability,
  type TutorProfile,
  type InsertTutorProfile,
  type Pricing,
  type InsertPricing,
  type BookingPayment,
  type InsertBookingPayment,
  type PaymentLink,
  type InsertPaymentLink,
  type AdminSettings,
  type InsertAdminSettings,
  type ActionLog,
  type InsertActionLog,
  type ChatMessage,
  type InsertChatMessage,
  type ChatConversation,
  type InsertChatConversation,
} from '@shared/schema';
import type { IStorage } from './storage';

// Hash password using bcrypt (secure, salted)
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password against bcrypt hash
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Database storage implementation
export class DbStorage implements IStorage {
  // Contact submission methods
  async createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission> {
    const [result] = await db.insert(contactSubmissions).values({
      id: randomUUID(),
      ...submission,
    }).returning();
    return result;
  }

  async getAllContactSubmissions(): Promise<ContactSubmission[]> {
    return await db.select().from(contactSubmissions).orderBy(contactSubmissions.createdAt);
  }

  async getContactSubmission(id: string): Promise<ContactSubmission | undefined> {
    const [result] = await db.select().from(contactSubmissions).where(eq(contactSubmissions.id, id));
    return result;
  }

  // Appointment methods
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [result] = await db.insert(appointments).values({
      id: randomUUID(),
      ...appointment,
      status: 'pending',
    }).returning();
    return result;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(appointments.createdAt);
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [result] = await db.select().from(appointments).where(eq(appointments.id, id));
    return result;
  }

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined> {
    const [result] = await db.update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
    return result;
  }

  // Availability methods - these are stored in the database
  async createAvailability(availability: InsertAvailability): Promise<Availability> {
    const [result] = await db.insert(tutorAvailability).values({
      id: randomUUID(),
      ...availability,
      isBooked: false,
    }).returning();
    
    // Log the action
    await this.createActionLog({
      actionType: 'slot_added',
      description: `Time slot added for ${availability.day} ${availability.date || ''} ${availability.startTime}-${availability.endTime}`,
      userId: availability.tutorId,
      metadata: JSON.stringify(availability),
    });
    
    return result;
  }

  async getAllAvailabilities(): Promise<Availability[]> {
    return await db.select().from(tutorAvailability).orderBy(tutorAvailability.createdAt);
  }

  async getAvailabilitiesByTutor(tutorId: string): Promise<Availability[]> {
    return await db.select().from(tutorAvailability)
      .where(eq(tutorAvailability.tutorId, tutorId))
      .orderBy(tutorAvailability.createdAt);
  }

  async updateAvailability(id: string, updates: Partial<InsertAvailability> & { isBooked?: boolean }): Promise<Availability | undefined> {
    const [result] = await db.update(tutorAvailability)
      .set(updates)
      .where(eq(tutorAvailability.id, id))
      .returning();
    return result;
  }

  async deleteAvailability(id: string): Promise<boolean> {
    const result = await db.delete(tutorAvailability).where(eq(tutorAvailability.id, id)).returning();
    
    if (result.length > 0) {
      await this.createActionLog({
        actionType: 'slot_removed',
        description: `Time slot removed`,
        metadata: JSON.stringify(result[0]),
      });
    }
    
    return result.length > 0;
  }

  // Clean up past availability slots (for dates that have passed)
  async cleanupPastAvailability(): Promise<number> {
    const today = new Date();
    // Format as YYYY-MM-DD in Africa/Johannesburg timezone
    const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' });
    
    // Delete availability slots where the date has passed
    const result = await db.delete(tutorAvailability)
      .where(lt(tutorAvailability.date, todayStr))
      .returning();
    
    if (result.length > 0) {
      await this.createActionLog({
        actionType: 'availability_cleanup',
        description: `Cleaned up ${result.length} past availability slot(s)`,
        userId: 'system',
        metadata: JSON.stringify({ count: result.length, date: todayStr }),
      });
    }
    
    return result.length;
  }

  // Get upcoming sessions within specified hours for reminders
  async getUpcomingSessionsForReminders(hoursAhead: number): Promise<BookingPayment[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    
    const bookings = await db.select().from(bookingPayments)
      .where(and(
        eq(bookingPayments.isActive, true),
        eq(bookingPayments.reminderSent, false),
        eq(bookingPayments.paymentStatus, 'completed')
      ));
    
    // Filter sessions that start within the specified hours
    return bookings.filter(booking => {
      if (!booking.sessionStartTime) return false;
      const sessionStart = new Date(booking.sessionStartTime);
      return sessionStart > now && sessionStart <= futureTime;
    });
  }

  // Mark reminder as sent for a booking
  async markReminderSent(bookingId: string): Promise<void> {
    await db.update(bookingPayments)
      .set({ reminderSent: true })
      .where(eq(bookingPayments.id, bookingId));
  }

  // Get upcoming sessions for a specific tutor (for in-app notifications)
  async getUpcomingSessionsForTutor(tutorId: string): Promise<BookingPayment[]> {
    const now = new Date();
    const bookings = await db.select().from(bookingPayments)
      .where(and(
        eq(bookingPayments.tutorId, tutorId),
        eq(bookingPayments.isActive, true),
        eq(bookingPayments.paymentStatus, 'completed')
      ));
    
    // Filter to only include future sessions
    return bookings.filter(booking => {
      if (!booking.sessionStartTime) return false;
      const sessionStart = new Date(booking.sessionStartTime);
      return sessionStart > now;
    }).sort((a, b) => {
      const aTime = new Date(a.sessionStartTime!).getTime();
      const bTime = new Date(b.sessionStartTime!).getTime();
      return aTime - bTime;
    });
  }

  // Tutor profile methods
  async createTutorProfile(profile: InsertTutorProfile): Promise<TutorProfile> {
    const [result] = await db.insert(tutorProfiles).values({
      id: randomUUID(),
      ...profile,
      isApproved: false,
      isBlocked: false,
    }).returning();
    return result;
  }

  async getTutorProfileByUserId(supabaseUserId: string): Promise<TutorProfile | undefined> {
    const [result] = await db.select().from(tutorProfiles).where(eq(tutorProfiles.supabaseUserId, supabaseUserId));
    return result;
  }

  async getTutorProfileById(id: string): Promise<TutorProfile | undefined> {
    const [result] = await db.select().from(tutorProfiles).where(eq(tutorProfiles.id, id));
    return result;
  }

  async getAllTutorProfiles(): Promise<TutorProfile[]> {
    return await db.select().from(tutorProfiles).orderBy(tutorProfiles.createdAt);
  }

  async updateTutorProfile(id: string, updates: Partial<InsertTutorProfile>): Promise<TutorProfile | undefined> {
    const [result] = await db.update(tutorProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tutorProfiles.id, id))
      .returning();
    return result;
  }

  async approveTutor(id: string): Promise<TutorProfile | undefined> {
    const [result] = await db.update(tutorProfiles)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(tutorProfiles.id, id))
      .returning();
    
    if (result) {
      await this.createActionLog({
        actionType: 'tutor_approved',
        description: `Tutor ${result.fullName} approved`,
        userId: 'admin',
        metadata: JSON.stringify({ tutorId: id }),
      });
    }
    
    return result;
  }

  async blockTutor(id: string, blocked: boolean): Promise<TutorProfile | undefined> {
    const [result] = await db.update(tutorProfiles)
      .set({ isBlocked: blocked, updatedAt: new Date() })
      .where(eq(tutorProfiles.id, id))
      .returning();
    
    if (result) {
      await this.createActionLog({
        actionType: blocked ? 'tutor_blocked' : 'tutor_unblocked',
        description: `Tutor ${result.fullName} ${blocked ? 'blocked' : 'unblocked'}`,
        userId: 'admin',
        metadata: JSON.stringify({ tutorId: id }),
      });
    }
    
    return result;
  }

  // Get tutor profile by email (case-insensitive)
  async getTutorProfileByEmail(email: string): Promise<TutorProfile | undefined> {
    const normalizedEmail = email.toLowerCase().trim();
    const allTutors = await db.select().from(tutorProfiles);
    return allTutors.find(t => t.email.toLowerCase().trim() === normalizedEmail);
  }

  // Set tutor password (hashed)
  async setTutorPassword(id: string, password: string): Promise<boolean> {
    // For tutor auth, password should be the email address (normalized to lowercase)
    const normalizedPassword = password.toLowerCase().trim();
    const hash = await hashPassword(normalizedPassword);
    const [result] = await db.update(tutorProfiles)
      .set({ passwordHash: hash, updatedAt: new Date() })
      .where(eq(tutorProfiles.id, id))
      .returning();
    return !!result;
  }

  // Verify tutor password (case-insensitive email and password)
  async verifyTutorPassword(email: string, password: string): Promise<TutorProfile | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPassword = password.toLowerCase().trim();
    const tutor = await this.getTutorProfileByEmail(normalizedEmail);
    if (!tutor || !tutor.passwordHash) {
      return null;
    }
    const isValid = await verifyPassword(normalizedPassword, tutor.passwordHash);
    return isValid ? tutor : null;
  }

  // Pricing methods
  async createPricing(insertPricing: InsertPricing): Promise<Pricing> {
    const [result] = await db.insert(pricing).values({
      id: randomUUID(),
      ...insertPricing,
      isActive: insertPricing.isActive ?? true,
    }).returning();
    return result;
  }

  async getAllPricing(): Promise<Pricing[]> {
    return await db.select().from(pricing);
  }

  async getActivePricing(): Promise<Pricing[]> {
    return await db.select().from(pricing).where(eq(pricing.isActive, true));
  }

  async updatePricing(id: string, updates: Partial<InsertPricing>): Promise<Pricing | undefined> {
    const [result] = await db.update(pricing)
      .set(updates)
      .where(eq(pricing.id, id))
      .returning();
    return result;
  }

  // Booking payment methods
  async createBookingPayment(payment: InsertBookingPayment): Promise<BookingPayment> {
    const [result] = await db.insert(bookingPayments).values({
      id: randomUUID(),
      ...payment,
      paymentStatus: payment.paymentStatus || 'pending',
    }).returning();
    
    await this.createActionLog({
      actionType: 'booking_created',
      description: `Booking created for ${payment.studentName} - ${payment.hours} hour(s)`,
      userId: payment.studentEmail,
      metadata: JSON.stringify(payment),
    });
    
    return result;
  }

  async getBookingPayment(id: string): Promise<BookingPayment | undefined> {
    const [result] = await db.select().from(bookingPayments).where(eq(bookingPayments.id, id));
    return result;
  }

  async getAllBookingPayments(): Promise<BookingPayment[]> {
    return await db.select().from(bookingPayments).orderBy(bookingPayments.createdAt);
  }

  async getBookingPaymentsByTutor(tutorId: string): Promise<BookingPayment[]> {
    return await db.select().from(bookingPayments)
      .where(eq(bookingPayments.tutorId, tutorId))
      .orderBy(bookingPayments.createdAt);
  }

  async updateBookingPaymentStatus(id: string, status: string, meetingLink?: string): Promise<BookingPayment | undefined> {
    const updates: any = { paymentStatus: status };
    if (meetingLink) {
      updates.meetingLink = meetingLink;
    }
    const [result] = await db.update(bookingPayments)
      .set(updates)
      .where(eq(bookingPayments.id, id))
      .returning();
    return result;
  }

  async updateBookingPayment(id: string, updates: Partial<{ isActive: boolean; reminderSent: boolean }>): Promise<BookingPayment | undefined> {
    const [result] = await db.update(bookingPayments)
      .set(updates)
      .where(eq(bookingPayments.id, id))
      .returning();
    return result;
  }

  // Payment link methods
  async createPaymentLink(link: InsertPaymentLink): Promise<PaymentLink> {
    const [result] = await db.insert(paymentLinks).values({
      id: randomUUID(),
      ...link,
      isActive: link.isActive ?? true,
    }).returning();
    return result;
  }

  async getAllPaymentLinks(): Promise<PaymentLink[]> {
    return await db.select().from(paymentLinks).where(eq(paymentLinks.isActive, true));
  }

  async getPaymentLink(subject: string, hours: number): Promise<PaymentLink | undefined> {
    const allLinks = await db.select().from(paymentLinks)
      .where(eq(paymentLinks.isActive, true));
    return allLinks.find(l => l.subject === subject && l.hours === hours);
  }

  async updatePaymentLink(id: string, updates: Partial<InsertPaymentLink>): Promise<PaymentLink | undefined> {
    const [result] = await db.update(paymentLinks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentLinks.id, id))
      .returning();
    return result;
  }

  // Admin settings methods
  async getAdminByUsername(username: string): Promise<AdminSettings | undefined> {
    const [result] = await db.select().from(adminSettings).where(eq(adminSettings.username, username));
    return result;
  }

  async verifyAdminPassword(username: string, password: string): Promise<boolean> {
    const admin = await this.getAdminByUsername(username);
    if (!admin) return false;
    return verifyPassword(password, admin.passwordHash);
  }

  async createAdminSettings(settings: InsertAdminSettings): Promise<AdminSettings> {
    const [result] = await db.insert(adminSettings).values({
      id: randomUUID(),
      ...settings,
    }).returning();
    return result;
  }

  async updateAdminPassword(username: string, newPassword: string): Promise<AdminSettings | undefined> {
    const hashedPassword = await hashPassword(newPassword);
    const [result] = await db.update(adminSettings)
      .set({ passwordHash: hashedPassword, updatedAt: new Date() })
      .where(eq(adminSettings.username, username))
      .returning();
    return result;
  }

  // Action log methods
  async createActionLog(log: InsertActionLog): Promise<ActionLog> {
    const [result] = await db.insert(actionLogs).values({
      id: randomUUID(),
      ...log,
    }).returning();
    return result;
  }

  async getAllActionLogs(): Promise<ActionLog[]> {
    return await db.select().from(actionLogs).orderBy(actionLogs.createdAt);
  }

  async getRecentActionLogs(limit: number = 50): Promise<ActionLog[]> {
    const logs = await db.select().from(actionLogs).orderBy(actionLogs.createdAt);
    return logs.slice(-limit).reverse();
  }

  // Chat message methods
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [result] = await db.insert(chatMessages).values({
      id: randomUUID(),
      ...message,
      isRead: false,
    }).returning();
    
    // Update the conversation's lastMessageAt
    await db.update(chatConversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatConversations.id, message.conversationId));
    
    return result;
  }

  async getChatMessagesByConversation(conversationId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);
  }

  async markMessagesAsRead(conversationId: string, receiverEmail: string): Promise<void> {
    await db.update(chatMessages)
      .set({ isRead: true })
      .where(eq(chatMessages.conversationId, conversationId));
  }

  async getUnreadMessageCount(email: string): Promise<number> {
    const messages = await db.select().from(chatMessages)
      .where(eq(chatMessages.receiverEmail, email));
    return messages.filter(m => !m.isRead).length;
  }

  // Chat conversation methods
  async createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const [result] = await db.insert(chatConversations).values({
      id: randomUUID(),
      ...conversation,
      lastMessageAt: new Date(),
    }).returning();
    return result;
  }

  async getChatConversation(id: string): Promise<ChatConversation | undefined> {
    const [result] = await db.select().from(chatConversations)
      .where(eq(chatConversations.id, id));
    return result;
  }

  async getOrCreateConversation(studentEmail: string, studentName: string, tutorId: string, tutorEmail: string, tutorName: string): Promise<ChatConversation> {
    // Try to find existing conversation
    const allConversations = await db.select().from(chatConversations);
    const existing = allConversations.find(
      c => c.studentEmail === studentEmail && c.tutorId === tutorId
    );
    
    if (existing) {
      return existing;
    }
    
    // Create new conversation
    return this.createChatConversation({
      studentEmail,
      studentName,
      tutorId,
      tutorEmail,
      tutorName,
    });
  }

  async getConversationsByStudentEmail(email: string): Promise<ChatConversation[]> {
    return await db.select().from(chatConversations)
      .where(eq(chatConversations.studentEmail, email))
      .orderBy(desc(chatConversations.lastMessageAt));
  }

  async getConversationsByTutorId(tutorId: string): Promise<ChatConversation[]> {
    return await db.select().from(chatConversations)
      .where(eq(chatConversations.tutorId, tutorId))
      .orderBy(desc(chatConversations.lastMessageAt));
  }
}

// Initialize database with default data
export async function initializeDatabase(storage: DbStorage) {
  console.log('Initializing database with default data...');
  
  // Check if admin exists, if not create default admin
  const existingAdmin = await storage.getAdminByUsername('Lisa98');
  if (!existingAdmin) {
    console.log('Creating default admin account...');
    const hashedPassword = await hashPassword('Lisa98*#2025');
    await storage.createAdminSettings({
      username: 'Lisa98',
      passwordHash: hashedPassword,
    });
    console.log('Admin account created successfully');
  }
  
  // Initialize featured tutors if they don't exist
  const existingTutors = await storage.getAllTutorProfiles();
  if (existingTutors.length === 0) {
    console.log('Creating featured tutors...');
    
    const featuredTutors = [
      {
        supabaseUserId: 'siyanda-stekela',
        fullName: 'Siyanda Stekela',
        email: 'siyandastekela@gmail.com',
        bio: 'Professional Mathematics tutor with over 9 years of tutoring experience.',
        subjects: ['Maths', 'CAPS Curriculum', 'Cambridge Curriculum'],
        hourlyRate: 200,
        googleMeetUrl: 'https://meet.google.com/auv-hbbs-nre',
      },
      {
        supabaseUserId: 'siboniso-shandu',
        fullName: 'Siboniso Shandu',
        email: 'sbo.bernard@gmail.com',
        bio: 'Dedicated tutor in Mathematics and Physical Sciences with over 8 years of experience.',
        subjects: ['Mathematics', 'Physical Sciences'],
        hourlyRate: 200,
        googleMeetUrl: 'https://meet.google.com/krq-nbsr-gnh',
      },
      {
        supabaseUserId: 'thamsanqa-ngonyama',
        fullName: 'Thamsanqa Charles Ngonyama',
        email: 'ngonyama08@gmail.com',
        bio: 'Qualified educator specializing in English, History, and CAT.',
        subjects: ['English', 'History', 'CAT'],
        hourlyRate: 200,
        googleMeetUrl: 'https://meet.google.com/tha-msanqa-meet',
      },
      {
        supabaseUserId: 'lutho-hanjana',
        fullName: 'Lutho Hanjana',
        email: 'luthohanjana125@gmail.com',
        bio: 'I have a qualification in Opticianry that I obtained at the Cape Peninsula University of Capetown in the Faculty of Health Science. My aim is to empower the youth with knowledge that will shape their future.',
        subjects: ['Life Sciences', 'English', 'Maths', 'Physical Sciences'],
        hourlyRate: 200,
        googleMeetUrl: 'https://meet.google.com/tgv-tccd-ges',
      },
      {
        supabaseUserId: 'luthando-manisi',
        fullName: 'Luthando Manisi',
        email: 'luthandomanisi64@gmail.com',
        bio: 'Ek is passievol oor Afrikaans en dit is my doel om hierdie pragtige taal met die jeug te deel! I am deeply passionate about teaching Afrikaans and helping students discover the beauty of this South African language. My unique teaching approach combines conversational practice with grammar fundamentals, making learning enjoyable and effective. "Afrikaans is nie net \'n taal nie, dit is \'n kultuur en \'n manier van lewe." Whether you\'re a beginner or looking to improve your fluency, I\'m here to guide you on your Afrikaans journey. Kom ons leer saam!',
        subjects: ['Afrikaans'],
        hourlyRate: 250,
        googleMeetUrl: 'https://meet.google.com/vht-jkxn-hii',
        photoUrl: '/attached_assets/WhatsApp_Image_2025-12-22_at_15.52.01_0c22999e_1766433068327.jpg',
      },
      {
        supabaseUserId: 'simamkele-mabaso',
        fullName: 'Simamkele Mabaso',
        email: 'simamkelemabaso01@gmail.com',
        bio: 'I am Simamkele Mabaso, a professional tutor of Mathematics, Physical Science, Geography and Life Sciences with 2 years of experience and engaging with Students, bringing the best out of them and making sure I leave no stone unturned when delivering lessons to all learners.',
        subjects: ['Maths', 'Physical Sciences', 'Geography', 'Life Sciences'],
        hourlyRate: 200,
        googleMeetUrl: 'https://meet.google.com/simamkele-mabaso',
      },
    ];
    
    for (const tutor of featuredTutors) {
      const created = await storage.createTutorProfile(tutor);
      // Auto-approve featured tutors
      await storage.approveTutor(created.id);
      // Set password to be the same as email
      await storage.setTutorPassword(created.id, tutor.email);
    }
    
    console.log('Featured tutors created successfully');
  } else {
    // Reset all tutor passwords to their email (normalized to lowercase)
    console.log('Resetting tutor passwords...');
    for (const tutor of existingTutors) {
      console.log(`Resetting password for tutor: ${tutor.email}`);
      await storage.setTutorPassword(tutor.id, tutor.email);
    }
  }
  
  console.log('Database initialization complete');
}

export const dbStorage = new DbStorage();
