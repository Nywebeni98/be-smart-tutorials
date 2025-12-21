import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { dbStorage, initializeDatabase } from "./dbStorage";
import { insertContactSchema, insertAppointmentSchema, insertAvailabilitySchema, insertTutorProfileSchema, insertBookingPaymentSchema, passwordSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { Resend } from 'resend';

// Use database storage
const storage = dbStorage;

// Initialize Resend for email notifications
const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFICATION_EMAIL = 'onlinepresenceimpact@gmail.com';

// Helper function to send session reminder email
async function sendSessionReminderEmail(reminder: {
  recipientEmail: string;
  recipientName: string;
  tutorName: string;
  studentName?: string;
  subject: string;
  sessionTime: string;
  meetingLink?: string | null;
  isStudent: boolean;
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured, skipping reminder email');
      return;
    }

    const sessionDate = new Date(reminder.sessionTime);
    const formattedTime = sessionDate.toLocaleString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const { data, error } = await resend.emails.send({
      from: 'Be Smart Tutorials <onboarding@resend.dev>',
      to: [reminder.recipientEmail],
      subject: `Reminder: Your ${reminder.subject} session starts soon!`,
      html: `
        <h2>Session Reminder</h2>
        <p>Hi ${reminder.recipientName},</p>
        <p>This is a reminder that your tutoring session is starting soon:</p>
        <ul>
          <li><strong>Subject:</strong> ${reminder.subject}</li>
          <li><strong>Time:</strong> ${formattedTime}</li>
          ${reminder.isStudent ? `<li><strong>Tutor:</strong> ${reminder.tutorName}</li>` : `<li><strong>Student:</strong> ${reminder.studentName || 'Unknown'}</li>`}
        </ul>
        ${reminder.meetingLink ? `
          <p><strong>Join your session:</strong></p>
          <p><a href="${reminder.meetingLink}" style="background-color: #0a4191; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Google Meet</a></p>
          <p style="font-size: 12px;">Or copy this link: ${reminder.meetingLink}</p>
        ` : ''}
        <p>Good luck with your session!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This email was sent automatically by Be Smart Online Tutorials.</p>
      `,
    });

    if (error) {
      console.error('Failed to send reminder email:', error);
    } else {
      console.log('Reminder email sent successfully:', data?.id);
    }
  } catch (err) {
    console.error('Error sending reminder email:', err);
  }
}

// Helper function to send booking notification email
async function sendBookingNotificationEmail(booking: {
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  tutorName: string;
  subject: string;
  hours: number;
  amount: number;
  slotDate?: string;
  slotTime?: string;
  meetingLink?: string | null;
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured, skipping email notification');
      return;
    }

    const { data, error } = await resend.emails.send({
      from: 'Be Smart Tutorials <onboarding@resend.dev>',
      to: [NOTIFICATION_EMAIL],
      subject: `New Booking: ${booking.studentName} - ${booking.subject}`,
      html: `
        <h2>New Tutoring Session Booked!</h2>
        <p><strong>Student Details:</strong></p>
        <ul>
          <li><strong>Name:</strong> ${booking.studentName}</li>
          <li><strong>Email:</strong> ${booking.studentEmail}</li>
          <li><strong>Phone:</strong> ${booking.studentPhone || 'Not provided'}</li>
        </ul>
        <p><strong>Session Details:</strong></p>
        <ul>
          <li><strong>Tutor:</strong> ${booking.tutorName}</li>
          <li><strong>Subject:</strong> ${booking.subject}</li>
          <li><strong>Duration:</strong> ${booking.hours} hour(s)</li>
          <li><strong>Amount Paid:</strong> R${booking.amount}</li>
          ${booking.slotDate ? `<li><strong>Date:</strong> ${booking.slotDate}</li>` : ''}
          ${booking.slotTime ? `<li><strong>Time:</strong> ${booking.slotTime}</li>` : ''}
          ${booking.meetingLink ? `<li><strong>Google Meet Link:</strong> <a href="${booking.meetingLink}">${booking.meetingLink}</a></li>` : ''}
        </ul>
        <p>Please reach out to the student to confirm the session.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This email was sent automatically by Be Smart Online Tutorials booking system.</p>
      `,
    });

    if (error) {
      console.error('Failed to send booking notification email:', error);
    } else {
      console.log('Booking notification email sent successfully:', data?.id);
    }
  } catch (err) {
    console.error('Error sending booking notification email:', err);
  }
}

// Simple admin session tracking (in production, use proper sessions/JWT)
const adminSessions = new Set<string>();

// Pending booking tokens for pay-first flow
// Maps token -> booking info + timestamp (expires after 30 minutes)
const pendingBookingTokens = new Map<string, { tutorId: string; availabilityId: string; subject: string; hours: number; amount: number; studentName: string; studentEmail: string; createdAt: number }>();

// Clean expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  pendingBookingTokens.forEach((data, token) => {
    if (now - data.createdAt > 30 * 60 * 1000) { // 30 minutes
      pendingBookingTokens.delete(token);
    }
  });
}, 5 * 60 * 1000);

// Middleware to check admin authorization
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminToken = req.headers['x-admin-token'] as string;
  if (!adminToken || !adminSessions.has(adminToken)) {
    return res.status(403).json({
      success: false,
      message: "Admin authorization required",
    });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with default data (payment links, admin, featured tutors)
  try {
    await initializeDatabase(storage);
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }

  // Payment links endpoints
  app.get("/api/payment-links", async (req, res) => {
    try {
      const links = await storage.getAllPaymentLinks();
      res.json(links);
    } catch (error) {
      console.error("Error fetching payment links:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.get("/api/payment-links/:subject/:hours", async (req, res) => {
    try {
      const { subject, hours } = req.params;
      const link = await storage.getPaymentLink(subject, parseInt(hours));
      if (!link) {
        return res.status(404).json({
          success: false,
          message: "Payment link not found",
        });
      }
      res.json(link);
    } catch (error) {
      console.error("Error fetching payment link:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Admin-only payment link management
  app.post("/api/payment-links", requireAdmin, async (req, res) => {
    try {
      const { subject, hours, amount, url } = req.body;
      const link = await storage.createPaymentLink({ subject, hours, amount, url });
      res.status(201).json(link);
    } catch (error) {
      console.error("Error creating payment link:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.patch("/api/payment-links/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const link = await storage.updatePaymentLink(id, updates);
      if (!link) {
        return res.status(404).json({
          success: false,
          message: "Payment link not found",
        });
      }
      res.json(link);
    } catch (error) {
      console.error("Error updating payment link:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Action logs endpoints (admin only)
  app.get("/api/action-logs", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getRecentActionLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching action logs:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const submission = await storage.createContactSubmission(validatedData);
      res.status(201).json({
        success: true,
        message: "Contact form submitted successfully",
        id: submission.id,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationError.message,
        });
      }
      console.error("Error submitting contact form:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.get("/api/contact/submissions", async (req, res) => {
    try {
      const submissions = await storage.getAllContactSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Appointment booking endpoints
  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json({
        success: true,
        message: "Appointment booked successfully",
        id: appointment.id,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationError.message,
        });
      }
      console.error("Error booking appointment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.patch("/api/appointments/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const appointment = await storage.updateAppointmentStatus(id, status);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }
      res.json({
        success: true,
        message: "Appointment status updated",
        appointment,
      });
    } catch (error) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Availability management endpoints
  app.post("/api/availability", async (req, res) => {
    try {
      const validatedData = insertAvailabilitySchema.parse(req.body);
      const availability = await storage.createAvailability(validatedData);
      res.status(201).json({
        success: true,
        message: "Availability added successfully",
        id: availability.id,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationError.message,
        });
      }
      console.error("Error adding availability:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.get("/api/availability", async (req, res) => {
    try {
      const availabilities = await storage.getAllAvailabilities();
      res.json(availabilities);
    } catch (error) {
      console.error("Error fetching availabilities:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.delete("/api/availability/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAvailability(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Availability not found",
        });
      }
      res.json({
        success: true,
        message: "Availability deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting availability:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Get availability by tutor ID
  app.get("/api/availability/tutor/:tutorId", async (req, res) => {
    try {
      const { tutorId } = req.params;
      const availabilities = await storage.getAvailabilitiesByTutor(tutorId);
      res.json(availabilities);
    } catch (error) {
      console.error("Error fetching tutor availabilities:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Update availability
  app.patch("/api/availability/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const availability = await storage.updateAvailability(id, req.body);
      if (!availability) {
        return res.status(404).json({
          success: false,
          message: "Availability not found",
        });
      }
      res.json({
        success: true,
        message: "Availability updated successfully",
        availability,
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Tutor profile endpoints
  app.post("/api/tutor-profiles", async (req, res) => {
    try {
      console.log("Creating tutor profile with data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertTutorProfileSchema.parse(req.body);
      const profile = await storage.createTutorProfile(validatedData);
      res.status(201).json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        console.error("Tutor profile validation error:", validationError.message);
        return res.status(400).json({
          success: false,
          message: validationError.message,
          errors: validationError.details,
        });
      }
      console.error("Error creating tutor profile:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  });

  app.get("/api/tutor-profiles", async (req, res) => {
    try {
      const profiles = await storage.getAllTutorProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching tutor profiles:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.get("/api/tutor-profiles/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getTutorProfileByUserId(userId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Tutor profile not found",
        });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching tutor profile:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Get tutor profile by email (for Google OAuth sign-in)
  app.get("/api/tutor-profiles/email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const profiles = await storage.getAllTutorProfiles();
      const profile = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Tutor profile not found for this email",
        });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching tutor profile by email:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Check if email is allowed for tutor access
  app.get("/api/auth/check-tutor-email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const emailLower = email.toLowerCase();
      
      // Admin email is always allowed (using configured notification email)
      if (emailLower === NOTIFICATION_EMAIL.toLowerCase()) {
        return res.json({ allowed: true, isAdmin: true });
      }
      
      // Check if email belongs to a registered tutor
      const profiles = await storage.getAllTutorProfiles();
      const tutorProfile = profiles.find(p => p.email.toLowerCase() === emailLower);
      
      if (tutorProfile) {
        return res.json({ 
          allowed: true, 
          isAdmin: false,
          tutorId: tutorProfile.id,
          isApproved: tutorProfile.isApproved,
          isBlocked: tutorProfile.isBlocked
        });
      }
      
      res.json({ allowed: false });
    } catch (error) {
      console.error("Error checking tutor email:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.get("/api/tutor-profiles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const profile = await storage.getTutorProfileById(id);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Tutor profile not found",
        });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching tutor profile:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.patch("/api/tutor-profiles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const profile = await storage.updateTutorProfile(id, req.body);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Tutor profile not found",
        });
      }
      res.json({
        success: true,
        message: "Tutor profile updated successfully",
        profile,
      });
    } catch (error) {
      console.error("Error updating tutor profile:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Admin routes for tutor management (protected by admin token)
  app.patch("/api/tutor-profiles/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const profile = await storage.approveTutor(id);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Tutor profile not found",
        });
      }
      res.json({
        success: true,
        message: "Tutor approved successfully",
        profile,
      });
    } catch (error) {
      console.error("Error approving tutor:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.patch("/api/tutor-profiles/:id/block", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { blocked } = req.body;
      const profile = await storage.blockTutor(id, blocked);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Tutor profile not found",
        });
      }
      res.json({
        success: true,
        message: blocked ? "Tutor blocked successfully" : "Tutor unblocked successfully",
        profile,
      });
    } catch (error) {
      console.error("Error blocking/unblocking tutor:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Pricing endpoints
  app.get("/api/pricing", async (req, res) => {
    try {
      const pricing = await storage.getActivePricing();
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching pricing:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.patch("/api/pricing/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const pricing = await storage.updatePricing(id, req.body);
      if (!pricing) {
        return res.status(404).json({
          success: false,
          message: "Pricing not found",
        });
      }
      res.json({
        success: true,
        message: "Pricing updated successfully",
        pricing,
      });
    } catch (error) {
      console.error("Error updating pricing:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Booking payment endpoints
  app.post("/api/booking-payments", async (req, res) => {
    try {
      const validatedData = insertBookingPaymentSchema.parse(req.body);
      const payment = await storage.createBookingPayment(validatedData);
      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        payment,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationError.message,
        });
      }
      console.error("Error creating booking payment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.get("/api/booking-payments", async (req, res) => {
    try {
      const payments = await storage.getAllBookingPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching booking payments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.get("/api/booking-payments/tutor/:tutorId", async (req, res) => {
    try {
      const { tutorId } = req.params;
      const payments = await storage.getBookingPaymentsByTutor(tutorId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching tutor booking payments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.get("/api/booking-payments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getBookingPayment(id);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Booking payment not found",
        });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error fetching booking payment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.patch("/api/booking-payments/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, meetingLink } = req.body;
      const payment = await storage.updateBookingPaymentStatus(id, status, meetingLink);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Booking payment not found",
        });
      }
      res.json({
        success: true,
        message: "Booking payment status updated successfully",
        payment,
      });
    } catch (error) {
      console.error("Error updating booking payment status:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Password validation endpoint (server-side)
  app.post("/api/validate-password", async (req, res) => {
    try {
      const { password } = req.body;
      const result = passwordSchema.safeParse(password);
      if (!result.success) {
        return res.status(400).json({
          valid: false,
          errors: result.error.errors.map(e => e.message),
        });
      }
      res.json({ valid: true });
    } catch (error) {
      console.error("Error validating password:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Yoco Payment Integration
  app.post("/api/yoco/create-checkout", async (req, res) => {
    try {
      const { tutorId, tutorName, availabilityId, hours, amount, studentName, studentEmail, studentPhone } = req.body;
      
      const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
      if (!YOCO_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message: "Payment system not configured. Please contact support.",
        });
      }

      // Create a booking payment record first (pending status)
      const bookingPayment = await storage.createBookingPayment({
        tutorId,
        availabilityId,
        studentName,
        studentEmail,
        studentPhone: studentPhone || null,
        hours,
        amount,
        paymentStatus: 'pending',
        yocoCheckoutId: null,
        meetingLink: null,
      });

      // Get the base URL for callbacks
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;

      // Create Yoco checkout session
      const yocoResponse = await fetch('https://payments.yoco.com/api/checkouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
        },
        body: JSON.stringify({
          amount: amount * 100, // Yoco uses cents
          currency: 'ZAR',
          successUrl: `${baseUrl}/payment/success?bookingId=${bookingPayment.id}`,
          cancelUrl: `${baseUrl}/payment/cancel?bookingId=${bookingPayment.id}`,
          failureUrl: `${baseUrl}/payment/failure?bookingId=${bookingPayment.id}`,
          metadata: {
            bookingId: bookingPayment.id,
            tutorId,
            tutorName,
            studentEmail,
            hours: hours.toString(),
          },
        }),
      });

      if (!yocoResponse.ok) {
        const errorData = await yocoResponse.json();
        console.error('Yoco checkout creation failed:', errorData);
        return res.status(500).json({
          success: false,
          message: "Failed to create payment session",
        });
      }

      const yocoData = await yocoResponse.json();

      // Update booking with Yoco checkout ID
      await storage.updateBookingPaymentStatus(bookingPayment.id, 'pending', undefined);

      res.json({
        success: true,
        checkoutId: yocoData.id,
        redirectUrl: yocoData.redirectUrl,
        bookingId: bookingPayment.id,
      });
    } catch (error) {
      console.error("Error creating Yoco checkout:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Yoco payment webhook
  app.post("/api/yoco/webhook", async (req, res) => {
    try {
      const event = req.body;
      
      if (event.type === 'payment.succeeded') {
        const { checkoutId, metadata } = event.payload;
        if (metadata?.bookingId) {
          // Get the tutor's Google Meet URL
          const booking = await storage.getBookingPayment(metadata.bookingId);
          if (booking) {
            const tutorProfile = await storage.getTutorProfileById(booking.tutorId);
            const meetingLink = tutorProfile?.googleMeetUrl || undefined;
            
            await storage.updateBookingPaymentStatus(metadata.bookingId, 'completed', meetingLink);
            
            // Mark the availability slot as booked
            if (booking.availabilityId) {
              await storage.updateAvailability(booking.availabilityId, { isBooked: true });
            }
          }
        }
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error("Error processing Yoco webhook:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Payment callback endpoints for frontend redirect handling
  app.post("/api/payment/complete/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const booking = await storage.getBookingPayment(bookingId);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Get tutor's Google Meet URL
      const tutorProfile = await storage.getTutorProfileById(booking.tutorId);
      const meetingLink = tutorProfile?.googleMeetUrl || undefined;

      // Update payment status to completed
      const updatedBooking = await storage.updateBookingPaymentStatus(bookingId, 'completed', meetingLink);

      // Mark availability as booked
      if (booking.availabilityId) {
        await storage.updateAvailability(booking.availabilityId, { isBooked: true });
      }

      res.json({
        success: true,
        message: "Payment completed successfully",
        booking: updatedBooking,
        meetingLink,
      });
    } catch (error) {
      console.error("Error completing payment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Fixed pricing configuration for pay-first flow
  // Maths, English, History, CAT = R200/hr
  // Physical Sciences = R250/hr
  const ALLOWED_PRICING: Record<string, Record<number, number>> = {
    'Maths': { 1: 200, 2: 400 },
    'English': { 1: 200, 2: 400 },
    'History': { 1: 200, 2: 400 },
    'CAT': { 1: 200, 2: 400 },
    'Physical Sciences': { 1: 250, 2: 500 },
  };

  // Create a booking token before redirecting to payment (pay-first flow)
  app.post("/api/booking/create-token", async (req, res) => {
    try {
      const { tutorId, availabilityId, subject, studentName, studentEmail } = req.body;
      // Convert hours and amount to numbers to handle string inputs
      const hours = Number(req.body.hours);
      const amount = Number(req.body.amount);
      
      console.log("Create token request:", { tutorId, availabilityId, subject, hours, amount, studentName, studentEmail });
      
      if (!tutorId || !subject || !hours || !amount) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      if (!studentName || !studentEmail) {
        return res.status(400).json({
          success: false,
          message: "Student name and email are required",
        });
      }

      // Validate subject is allowed
      if (!ALLOWED_PRICING[subject]) {
        return res.status(400).json({
          success: false,
          message: "Invalid subject. Supported subjects: Maths, Physical Sciences, English, History, CAT.",
        });
      }

      // Validate hours is allowed (1 or 2)
      if (hours !== 1 && hours !== 2) {
        return res.status(400).json({
          success: false,
          message: "Invalid hours. Only 1 or 2 hours are supported.",
        });
      }

      // Validate amount matches expected pricing
      const expectedAmount = ALLOWED_PRICING[subject][hours];
      if (amount !== expectedAmount) {
        return res.status(400).json({
          success: false,
          message: `Invalid amount. Expected R${expectedAmount} for ${subject} ${hours} hour(s).`,
        });
      }

      // Verify tutor exists
      const tutorProfile = await storage.getTutorProfileById(tutorId);
      if (!tutorProfile) {
        return res.status(400).json({
          success: false,
          message: "Invalid tutor ID.",
        });
      }

      // For pay-first flow, availability slot is optional
      // Tutor and student can schedule the actual time after payment
      // If availabilityId is provided, verify it exists and is not booked
      if (availabilityId) {
        try {
          const availabilities = await storage.getAvailabilitiesByTutor(tutorId);
          const slot = availabilities.find(a => a.id === availabilityId);
          if (slot && slot.isBooked) {
            return res.status(400).json({
              success: false,
              message: "This time slot is already booked. Please choose another.",
            });
          }
          // If slot not found, just ignore it and proceed (can be scheduled later)
        } catch (e) {
          // If there's an error checking availability, just proceed
          console.log("Note: Could not verify availability slot, proceeding without slot validation");
        }
      }

      // Generate a unique token
      const token = `booking_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Store the pending booking info with validated data including student contact info
      pendingBookingTokens.set(token, {
        tutorId,
        availabilityId: availabilityId || '',
        subject,
        hours,
        amount: expectedAmount, // Use server-validated amount
        studentName,
        studentEmail,
        createdAt: Date.now(),
      });

      res.json({
        success: true,
        token,
      });
    } catch (error) {
      console.error("Error creating booking token:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Post-payment booking completion (pay-first flow)
  // This endpoint is called AFTER payment when student enters their details
  app.post("/api/booking-payments/complete", async (req, res) => {
    try {
      const { bookingToken, studentName: reqStudentName, studentEmail: reqStudentEmail, studentPhone } = req.body;
      
      if (!bookingToken) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: bookingToken is required",
        });
      }

      // Validate the booking token
      const pendingBooking = pendingBookingTokens.get(bookingToken);
      if (!pendingBooking) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired booking token. Please start a new booking.",
        });
      }

      // Check if token is expired (30 minutes) - do this BEFORE any other processing
      if (Date.now() - pendingBooking.createdAt > 30 * 60 * 1000) {
        pendingBookingTokens.delete(bookingToken);
        return res.status(400).json({
          success: false,
          message: "Booking token has expired. Please start a new booking.",
        });
      }

      // Use stored student info from token, allow override from request
      const studentName = reqStudentName || pendingBooking.studentName;
      const studentEmail = reqStudentEmail || pendingBooking.studentEmail;

      if (!studentName?.trim() || !studentEmail?.trim()) {
        pendingBookingTokens.delete(bookingToken);
        return res.status(400).json({
          success: false,
          message: "Missing student name or email. Please start a new booking.",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(studentEmail.trim())) {
        pendingBookingTokens.delete(bookingToken);
        return res.status(400).json({
          success: false,
          message: "Invalid email address format. Please start a new booking.",
        });
      }

      // Normalize the values
      const normalizedName = studentName.trim();
      const normalizedEmail = studentEmail.trim();

      // Verify availability is still unbooked (in case another student booked it first)
      if (pendingBooking.availabilityId) {
        const availabilities = await storage.getAvailabilitiesByTutor(pendingBooking.tutorId);
        const slot = availabilities.find(a => a.id === pendingBooking.availabilityId);
        if (slot && slot.isBooked) {
          pendingBookingTokens.delete(bookingToken);
          return res.status(400).json({
            success: false,
            message: "This time slot has already been booked by another student. Please contact support for a refund.",
          });
        }
      }

      // Get tutor's Google Meet URL
      const tutorProfile = await storage.getTutorProfileById(pendingBooking.tutorId);
      const meetingLink = tutorProfile?.googleMeetUrl || null;

      // Calculate session start and end times from availability slot
      let sessionStartTime: Date | null = null;
      let sessionEndTime: Date | null = null;
      if (pendingBooking.availabilityId) {
        const availabilities = await storage.getAvailabilitiesByTutor(pendingBooking.tutorId);
        const slot = availabilities.find(a => a.id === pendingBooking.availabilityId);
        if (slot && slot.date && slot.startTime && slot.endTime) {
          // Parse the date (format: "18 December 2024" or similar)
          const dateStr = slot.date;
          const startTimeStr = slot.startTime;
          const endTimeStr = slot.endTime;
          
          // Try to parse the date and times
          try {
            const dateParts = dateStr.match(/(\d+)\s+(\w+)\s+(\d+)/);
            if (dateParts) {
              const day = parseInt(dateParts[1]);
              const monthName = dateParts[2];
              const year = parseInt(dateParts[3]);
              const months: Record<string, number> = {
                January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
                July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
              };
              const month = months[monthName];
              
              // Parse start time (format: "09:00" or "9:00 AM")
              const startMatch = startTimeStr.match(/(\d+):(\d+)/);
              if (startMatch) {
                const startHour = parseInt(startMatch[1]);
                const startMin = parseInt(startMatch[2]);
                sessionStartTime = new Date(year, month, day, startHour, startMin);
              }
              
              // Parse end time
              const endMatch = endTimeStr.match(/(\d+):(\d+)/);
              if (endMatch) {
                const endHour = parseInt(endMatch[1]);
                const endMin = parseInt(endMatch[2]);
                sessionEndTime = new Date(year, month, day, endHour, endMin);
              }
            }
          } catch (e) {
            console.error('Error parsing session times:', e);
          }
        }
      }

      // Create the booking payment record (payment completed via Yoco link)
      const bookingPayment = await storage.createBookingPayment({
        tutorId: pendingBooking.tutorId,
        availabilityId: pendingBooking.availabilityId || null,
        studentName: normalizedName,
        studentEmail: normalizedEmail,
        studentPhone: studentPhone || null,
        hours: pendingBooking.hours,
        amount: pendingBooking.amount,
        paymentStatus: 'completed', // Payment done via Yoco link
        yocoCheckoutId: null,
        meetingLink,
        subject: pendingBooking.subject || null,
        sessionStartTime,
        sessionEndTime,
      });

      // Mark availability as booked if provided
      let slotDate: string | undefined;
      let slotTime: string | undefined;
      if (pendingBooking.availabilityId) {
        await storage.updateAvailability(pendingBooking.availabilityId, { isBooked: true });
        // Get slot details for email
        const availabilities = await storage.getAvailabilitiesByTutor(pendingBooking.tutorId);
        const slot = availabilities.find(a => a.id === pendingBooking.availabilityId);
        if (slot) {
          slotDate = slot.date ?? undefined;
          slotTime = `${slot.startTime} - ${slot.endTime}`;
        }
      }

      // Delete the used token (one-time use)
      pendingBookingTokens.delete(bookingToken);

      // Log the booking action for admin dashboard notifications
      await storage.createActionLog({
        actionType: 'booking_completed',
        description: `New booking: ${normalizedName} booked ${pendingBooking.subject} (${pendingBooking.hours} hour(s)) with ${tutorProfile?.fullName || 'Unknown Tutor'} for R${pendingBooking.amount}`,
        userId: normalizedEmail,
        metadata: JSON.stringify({
          bookingId: bookingPayment.id,
          studentName: normalizedName,
          studentEmail: normalizedEmail,
          tutorId: pendingBooking.tutorId,
          tutorName: tutorProfile?.fullName,
          subject: pendingBooking.subject,
          hours: pendingBooking.hours,
          amount: pendingBooking.amount,
          slotDate,
          slotTime,
        }),
      });

      // Send booking notification email to admin
      sendBookingNotificationEmail({
        studentName: normalizedName,
        studentEmail: normalizedEmail,
        studentPhone: studentPhone || null,
        tutorName: tutorProfile?.fullName || 'Unknown Tutor',
        subject: pendingBooking.subject,
        hours: pendingBooking.hours,
        amount: pendingBooking.amount,
        slotDate,
        slotTime,
        meetingLink,
      });

      res.status(201).json({
        success: true,
        message: "Booking completed successfully",
        booking: bookingPayment,
        meetingLink,
        tutorDetails: {
          name: tutorProfile?.fullName || 'Unknown Tutor',
          email: tutorProfile?.email || null,
          phone: tutorProfile?.phone || null,
          googleMeetUrl: meetingLink,
        },
        sessionDetails: {
          date: slotDate,
          time: slotTime,
          subject: pendingBooking.subject,
          hours: pendingBooking.hours,
        },
      });
    } catch (error) {
      console.error("Error completing booking:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Admin authentication endpoint (secure server-side validation)
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Verify credentials against database (password is hashed)
      const isValid = await storage.verifyAdminPassword(username, password);
      
      if (isValid) {
        // Generate a simple token (in production, use proper JWT)
        const token = `admin_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        adminSessions.add(token);
        
        // Log admin login
        await storage.createActionLog({
          actionType: 'admin_login',
          description: `Admin ${username} logged in`,
          userId: username,
        });
        
        res.json({
          success: true,
          message: "Admin login successful",
          token,
        });
      } else {
        res.status(401).json({
          success: false,
          message: "Invalid admin credentials",
        });
      }
    } catch (error) {
      console.error("Error in admin login:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Admin logout endpoint
  app.post("/api/admin/logout", (req, res) => {
    const adminToken = req.headers['x-admin-token'] as string;
    if (adminToken) {
      adminSessions.delete(adminToken);
    }
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Get booking details by student email (for viewing active bookings)
  app.get("/api/bookings/student/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const bookings = await storage.getAllBookingPayments();
      const now = new Date();
      
      // Filter bookings for this student and determine visibility
      const studentBookings = bookings
        .filter(b => b.studentEmail === email && b.paymentStatus === 'completed')
        .map(booking => {
          // Check if session is still active (before end time)
          const isActive = booking.isActive && 
            (!booking.sessionEndTime || new Date(booking.sessionEndTime) > now);
          
          // Only return tutor details if session is active
          return {
            id: booking.id,
            subject: booking.subject,
            hours: booking.hours,
            amount: booking.amount,
            sessionStartTime: booking.sessionStartTime,
            sessionEndTime: booking.sessionEndTime,
            isActive,
            // Only include tutor details if session hasn't ended
            meetingLink: isActive ? booking.meetingLink : null,
            tutorId: booking.tutorId,
            createdAt: booking.createdAt,
          };
        });

      res.json(studentBookings);
    } catch (error) {
      console.error("Error fetching student bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Get single booking with tutor details (for active sessions only)
  app.get("/api/bookings/:id/details", async (req, res) => {
    try {
      const { id } = req.params;
      const bookings = await storage.getAllBookingPayments();
      const booking = bookings.find(b => b.id === id);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const now = new Date();
      const isActive = booking.isActive && 
        (!booking.sessionEndTime || new Date(booking.sessionEndTime) > now);

      // Only include tutor details if session is active
      if (isActive) {
        const tutorProfile = await storage.getTutorProfileById(booking.tutorId);
        return res.json({
          ...booking,
          isActive: true,
          tutorDetails: {
            name: tutorProfile?.fullName || 'Unknown Tutor',
            email: tutorProfile?.email || null,
            phone: tutorProfile?.phone || null,
            googleMeetUrl: booking.meetingLink,
          }
        });
      } else {
        // Session ended - hide sensitive info
        return res.json({
          id: booking.id,
          subject: booking.subject,
          hours: booking.hours,
          amount: booking.amount,
          sessionStartTime: booking.sessionStartTime,
          sessionEndTime: booking.sessionEndTime,
          isActive: false,
          tutorDetails: null,
          meetingLink: null,
        });
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      res.status(500).json({ error: "Failed to fetch booking details" });
    }
  });

  // Admin endpoint to expire old sessions (can be called manually or via cron)
  app.post("/api/admin/expire-sessions", requireAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookingPayments();
      const now = new Date();
      let expiredCount = 0;

      for (const booking of bookings) {
        if (booking.isActive && booking.sessionEndTime && new Date(booking.sessionEndTime) < now) {
          await storage.updateBookingPayment(booking.id, { isActive: false });
          expiredCount++;
        }
      }

      await storage.createActionLog({
        actionType: 'sessions_expired',
        description: `Expired ${expiredCount} session(s)`,
        userId: 'system',
      });

      res.json({ success: true, expiredCount });
    } catch (error) {
      console.error("Error expiring sessions:", error);
      res.status(500).json({ error: "Failed to expire sessions" });
    }
  });

  // Admin endpoint to get all sessions (past and upcoming)
  app.get("/api/admin/sessions", requireAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookingPayments();
      const tutorProfiles = await storage.getAllTutorProfiles();
      const now = new Date();

      const sessions = bookings
        .filter(b => b.paymentStatus === 'completed')
        .map(booking => {
          const tutor = tutorProfiles.find(t => t.id === booking.tutorId);
          const isUpcoming = booking.sessionStartTime && new Date(booking.sessionStartTime) > now;
          const isPast = booking.sessionEndTime && new Date(booking.sessionEndTime) < now;
          
          return {
            ...booking,
            tutorName: tutor?.fullName || 'Unknown Tutor',
            tutorEmail: tutor?.email,
            tutorPhone: tutor?.phone,
            status: isPast ? 'completed' : (isUpcoming ? 'upcoming' : 'in_progress'),
          };
        })
        .sort((a, b) => {
          const dateA = a.sessionStartTime ? new Date(a.sessionStartTime).getTime() : 0;
          const dateB = b.sessionStartTime ? new Date(b.sessionStartTime).getTime() : 0;
          return dateB - dateA; // Most recent first
        });

      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Send reminder emails for upcoming sessions (called by scheduler or manually)
  app.post("/api/admin/send-reminders", requireAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookingPayments();
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      let remindersSent = 0;

      for (const booking of bookings) {
        if (
          booking.paymentStatus === 'completed' &&
          !booking.reminderSent &&
          booking.sessionStartTime &&
          new Date(booking.sessionStartTime) > now &&
          new Date(booking.sessionStartTime) <= oneHourFromNow
        ) {
          const tutorProfile = await storage.getTutorProfileById(booking.tutorId);
          
          // Send reminder to student
          await sendSessionReminderEmail({
            recipientEmail: booking.studentEmail,
            recipientName: booking.studentName,
            tutorName: tutorProfile?.fullName || 'Your Tutor',
            subject: booking.subject || 'Tutoring Session',
            sessionTime: booking.sessionStartTime.toISOString(),
            meetingLink: booking.meetingLink,
            isStudent: true,
          });

          // Send reminder to tutor
          if (tutorProfile?.email) {
            await sendSessionReminderEmail({
              recipientEmail: tutorProfile.email,
              recipientName: tutorProfile.fullName,
              tutorName: tutorProfile.fullName,
              studentName: booking.studentName,
              subject: booking.subject || 'Tutoring Session',
              sessionTime: booking.sessionStartTime.toISOString(),
              meetingLink: booking.meetingLink,
              isStudent: false,
            });
          }

          // Mark reminder as sent
          await storage.updateBookingPayment(booking.id, { reminderSent: true });
          remindersSent++;
        }
      }

      await storage.createActionLog({
        actionType: 'reminders_sent',
        description: `Sent ${remindersSent} reminder(s) for upcoming sessions`,
        userId: 'system',
      });

      res.json({ success: true, remindersSent });
    } catch (error) {
      console.error("Error sending reminders:", error);
      res.status(500).json({ error: "Failed to send reminders" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
