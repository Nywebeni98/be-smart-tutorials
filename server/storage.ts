import { type ContactSubmission, type InsertContactSubmission, type Appointment, type InsertAppointment, type Availability, type InsertAvailability, type TutorProfile, type InsertTutorProfile, type Pricing, type InsertPricing, type BookingPayment, type InsertBookingPayment } from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface with CRUD methods
export interface IStorage {
  // Contact submission methods
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  getAllContactSubmissions(): Promise<ContactSubmission[]>;
  getContactSubmission(id: string): Promise<ContactSubmission | undefined>;
  
  // Appointment methods
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAllAppointments(): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined>;
  
  // Availability methods
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  getAllAvailabilities(): Promise<Availability[]>;
  getAvailabilitiesByTutor(tutorId: string): Promise<Availability[]>;
  updateAvailability(id: string, updates: Partial<InsertAvailability> & { isBooked?: boolean }): Promise<Availability | undefined>;
  deleteAvailability(id: string): Promise<boolean>;
  
  // Tutor profile methods
  createTutorProfile(profile: InsertTutorProfile): Promise<TutorProfile>;
  getTutorProfileByUserId(supabaseUserId: string): Promise<TutorProfile | undefined>;
  getTutorProfileById(id: string): Promise<TutorProfile | undefined>;
  getAllTutorProfiles(): Promise<TutorProfile[]>;
  updateTutorProfile(id: string, updates: Partial<InsertTutorProfile>): Promise<TutorProfile | undefined>;
  approveTutor(id: string): Promise<TutorProfile | undefined>;
  blockTutor(id: string, blocked: boolean): Promise<TutorProfile | undefined>;
  
  // Pricing methods
  createPricing(pricing: InsertPricing): Promise<Pricing>;
  getAllPricing(): Promise<Pricing[]>;
  getActivePricing(): Promise<Pricing[]>;
  updatePricing(id: string, updates: Partial<InsertPricing>): Promise<Pricing | undefined>;
  
  // Booking payment methods
  createBookingPayment(payment: InsertBookingPayment): Promise<BookingPayment>;
  getBookingPayment(id: string): Promise<BookingPayment | undefined>;
  getAllBookingPayments(): Promise<BookingPayment[]>;
  getBookingPaymentsByTutor(tutorId: string): Promise<BookingPayment[]>;
  updateBookingPaymentStatus(id: string, status: string, meetingLink?: string): Promise<BookingPayment | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private contactSubmissions: Map<string, ContactSubmission>;
  private appointments: Map<string, Appointment>;
  private availabilities: Map<string, Availability>;
  private tutorProfiles: Map<string, TutorProfile>;
  private pricingList: Map<string, Pricing>;
  private bookingPayments: Map<string, BookingPayment>;

  constructor() {
    this.contactSubmissions = new Map();
    this.appointments = new Map();
    this.availabilities = new Map();
    this.tutorProfiles = new Map();
    this.pricingList = new Map();
    this.bookingPayments = new Map();
    
    // Initialize default pricing
    this.initializeDefaultPricing();
  }
  
  private initializeDefaultPricing() {
    const pricing1: Pricing = {
      id: randomUUID(),
      hours: 1,
      amount: 200,
      isActive: true,
      createdAt: new Date(),
    };
    const pricing2: Pricing = {
      id: randomUUID(),
      hours: 2,
      amount: 400,
      isActive: true,
      createdAt: new Date(),
    };
    this.pricingList.set(pricing1.id, pricing1);
    this.pricingList.set(pricing2.id, pricing2);
  }

  async createContactSubmission(insertSubmission: InsertContactSubmission): Promise<ContactSubmission> {
    const id = randomUUID();
    const submission: ContactSubmission = { 
      ...insertSubmission, 
      id,
      createdAt: new Date(),
    };
    this.contactSubmissions.set(id, submission);
    return submission;
  }

  async getAllContactSubmissions(): Promise<ContactSubmission[]> {
    return Array.from(this.contactSubmissions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getContactSubmission(id: string): Promise<ContactSubmission | undefined> {
    return this.contactSubmissions.get(id);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      status: "pending",
      createdAt: new Date(),
      message: insertAppointment.message || null,
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (appointment) {
      appointment.status = status;
      this.appointments.set(id, appointment);
      return appointment;
    }
    return undefined;
  }

  async createAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    const id = randomUUID();
    const availability: Availability = {
      ...insertAvailability,
      id,
      date: insertAvailability.date || null,
      notes: insertAvailability.notes || null,
      isBooked: false,
      createdAt: new Date(),
    };
    this.availabilities.set(id, availability);
    return availability;
  }

  async getAllAvailabilities(): Promise<Availability[]> {
    return Array.from(this.availabilities.values())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getAvailabilitiesByTutor(tutorId: string): Promise<Availability[]> {
    return Array.from(this.availabilities.values())
      .filter(a => a.tutorId === tutorId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async updateAvailability(id: string, updates: Partial<InsertAvailability> & { isBooked?: boolean }): Promise<Availability | undefined> {
    const availability = this.availabilities.get(id);
    if (availability) {
      const updated = { ...availability, ...updates };
      this.availabilities.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteAvailability(id: string): Promise<boolean> {
    return this.availabilities.delete(id);
  }

  // Tutor profile methods
  async createTutorProfile(insertProfile: InsertTutorProfile): Promise<TutorProfile> {
    const id = randomUUID();
    const profile: TutorProfile = {
      ...insertProfile,
      id,
      photoUrl: insertProfile.photoUrl || null,
      subjects: insertProfile.subjects || null,
      hourlyRate: insertProfile.hourlyRate || 200,
      googleMeetUrl: insertProfile.googleMeetUrl || null,
      bio: insertProfile.bio || null,
      isApproved: false,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tutorProfiles.set(id, profile);
    return profile;
  }

  async getTutorProfileByUserId(supabaseUserId: string): Promise<TutorProfile | undefined> {
    return Array.from(this.tutorProfiles.values()).find(p => p.supabaseUserId === supabaseUserId);
  }

  async getTutorProfileById(id: string): Promise<TutorProfile | undefined> {
    return this.tutorProfiles.get(id);
  }

  async getAllTutorProfiles(): Promise<TutorProfile[]> {
    return Array.from(this.tutorProfiles.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateTutorProfile(id: string, updates: Partial<InsertTutorProfile>): Promise<TutorProfile | undefined> {
    const profile = this.tutorProfiles.get(id);
    if (profile) {
      const updated: TutorProfile = { 
        ...profile, 
        ...updates, 
        updatedAt: new Date() 
      };
      this.tutorProfiles.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async approveTutor(id: string): Promise<TutorProfile | undefined> {
    const profile = this.tutorProfiles.get(id);
    if (profile) {
      profile.isApproved = true;
      profile.updatedAt = new Date();
      this.tutorProfiles.set(id, profile);
      return profile;
    }
    return undefined;
  }

  async blockTutor(id: string, blocked: boolean): Promise<TutorProfile | undefined> {
    const profile = this.tutorProfiles.get(id);
    if (profile) {
      profile.isBlocked = blocked;
      profile.updatedAt = new Date();
      this.tutorProfiles.set(id, profile);
      return profile;
    }
    return undefined;
  }

  // Pricing methods
  async createPricing(insertPricing: InsertPricing): Promise<Pricing> {
    const id = randomUUID();
    const pricing: Pricing = {
      ...insertPricing,
      id,
      isActive: insertPricing.isActive ?? true,
      createdAt: new Date(),
    };
    this.pricingList.set(id, pricing);
    return pricing;
  }

  async getAllPricing(): Promise<Pricing[]> {
    return Array.from(this.pricingList.values());
  }

  async getActivePricing(): Promise<Pricing[]> {
    return Array.from(this.pricingList.values()).filter(p => p.isActive);
  }

  async updatePricing(id: string, updates: Partial<InsertPricing>): Promise<Pricing | undefined> {
    const pricing = this.pricingList.get(id);
    if (pricing) {
      const updated = { ...pricing, ...updates };
      this.pricingList.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // Booking payment methods
  async createBookingPayment(insertPayment: InsertBookingPayment): Promise<BookingPayment> {
    const id = randomUUID();
    const payment: BookingPayment = {
      ...insertPayment,
      id,
      studentPhone: insertPayment.studentPhone || null,
      availabilityId: insertPayment.availabilityId || null,
      hours: insertPayment.hours || 1,
      yocoCheckoutId: insertPayment.yocoCheckoutId || null,
      paymentStatus: insertPayment.paymentStatus || "pending",
      meetingLink: insertPayment.meetingLink || null,
      createdAt: new Date(),
    };
    this.bookingPayments.set(id, payment);
    return payment;
  }

  async getBookingPayment(id: string): Promise<BookingPayment | undefined> {
    return this.bookingPayments.get(id);
  }

  async getAllBookingPayments(): Promise<BookingPayment[]> {
    return Array.from(this.bookingPayments.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getBookingPaymentsByTutor(tutorId: string): Promise<BookingPayment[]> {
    return Array.from(this.bookingPayments.values())
      .filter(p => p.tutorId === tutorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateBookingPaymentStatus(id: string, status: string, meetingLink?: string): Promise<BookingPayment | undefined> {
    const payment = this.bookingPayments.get(id);
    if (payment) {
      payment.paymentStatus = status;
      if (meetingLink) {
        payment.meetingLink = meetingLink;
      }
      this.bookingPayments.set(id, payment);
      return payment;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
