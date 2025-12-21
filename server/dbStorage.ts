import { db } from './db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
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
}

// Initialize database with default data
export async function initializeDatabase(storage: DbStorage) {
  console.log('Initializing database with default data...');
  
  // Check if payment links exist, if not create them
  const existingLinks = await storage.getAllPaymentLinks();
  if (existingLinks.length === 0) {
    console.log('Creating default payment links...');
    
    // Maths payment links
    await storage.createPaymentLink({ subject: 'Maths', hours: 1, amount: 200, url: 'https://pay.yoco.com/r/4GQxeA' });
    await storage.createPaymentLink({ subject: 'Maths', hours: 2, amount: 400, url: 'https://pay.yoco.com/r/25ZL1w' });
    
    // Physical Sciences payment links
    await storage.createPaymentLink({ subject: 'Physical Sciences', hours: 1, amount: 250, url: 'https://pay.yoco.com/r/7vJexK' });
    await storage.createPaymentLink({ subject: 'Physical Sciences', hours: 2, amount: 500, url: 'https://pay.yoco.com/r/4kQVPZ' });
    
    // English (same as Maths pricing)
    await storage.createPaymentLink({ subject: 'English', hours: 1, amount: 200, url: 'https://pay.yoco.com/r/4GQxeA' });
    await storage.createPaymentLink({ subject: 'English', hours: 2, amount: 400, url: 'https://pay.yoco.com/r/25ZL1w' });
    
    // History (same as Maths pricing)
    await storage.createPaymentLink({ subject: 'History', hours: 1, amount: 200, url: 'https://pay.yoco.com/r/4GQxeA' });
    await storage.createPaymentLink({ subject: 'History', hours: 2, amount: 400, url: 'https://pay.yoco.com/r/25ZL1w' });
    
    // CAT (same as Maths pricing)
    await storage.createPaymentLink({ subject: 'CAT', hours: 1, amount: 200, url: 'https://pay.yoco.com/r/4GQxeA' });
    await storage.createPaymentLink({ subject: 'CAT', hours: 2, amount: 400, url: 'https://pay.yoco.com/r/25ZL1w' });
    
    console.log('Payment links created successfully');
  }
  
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
    // Ensure all existing tutors have passwords set (email as password)
    console.log('Checking tutor passwords...');
    for (const tutor of existingTutors) {
      if (!tutor.passwordHash) {
        console.log(`Setting password for tutor: ${tutor.email}`);
        await storage.setTutorPassword(tutor.id, tutor.email);
      }
    }
  }
  
  console.log('Database initialization complete');
}

export const dbStorage = new DbStorage();
