import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { dbStorage, initializeDatabase } from "./dbStorage";
import { insertContactSchema, insertAppointmentSchema, insertAvailabilitySchema, insertTutorProfileSchema, insertBookingPaymentSchema, passwordSchema, insertChatMessageSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { Resend } from 'resend';
import { setupWebSocketServer } from './websocket';
import crypto from 'crypto';

function generateZoomVideoSDKJWT(
  sessionName: string,
  role: number,
  userName: string,
  sessionKey?: string,
  userIdentity?: string
): string {
  const sdkKey = process.env.ZOOM_SDK_KEY;
  const sdkSecret = process.env.ZOOM_SDK_SECRET;
  
  if (!sdkKey || !sdkSecret) {
    throw new Error('Zoom SDK credentials not configured');
  }
  
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 2;
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    app_key: sdkKey,
    tpc: sessionName,
    role_type: role,
    user_identity: userIdentity || userName,
    session_key: sessionKey || '',
    iat,
    exp,
    version: 1,
  };
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', sdkSecret)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

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

// Helper function to send booking notification email to admin and tutor
async function sendBookingNotificationEmail(booking: {
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  tutorName: string;
  tutorEmail?: string | null;
  subject: string;
  hours: number;
  amount: number;
  slotDate?: string;
  slotTime?: string;
  meetingLink?: string | null;
}) {
  console.log('=== SENDING BOOKING NOTIFICATION EMAIL ===');
  console.log('Booking details:', JSON.stringify(booking, null, 2));
  console.log('Admin email:', NOTIFICATION_EMAIL);
  console.log('Tutor email:', booking.tutorEmail);
  
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('ERROR: RESEND_API_KEY not configured, skipping email notification');
      return;
    }
    console.log('RESEND_API_KEY is configured, proceeding with email...');

    // Send to admin
    const { data: adminData, error: adminError } = await resend.emails.send({
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

    if (adminError) {
      console.error('Failed to send booking notification email to admin:', adminError);
    } else {
      console.log('Booking notification email sent to admin successfully:', adminData?.id);
    }

    // Send to tutor if email is available
    if (booking.tutorEmail) {
      const { data: tutorData, error: tutorError } = await resend.emails.send({
        from: 'Be Smart Tutorials <onboarding@resend.dev>',
        to: [booking.tutorEmail],
        subject: `New Student Booking: ${booking.studentName} - ${booking.subject}`,
        html: `
          <h2>You Have a New Tutoring Session!</h2>
          <p>A student has booked a session with you.</p>
          <p><strong>Student Details:</strong></p>
          <ul>
            <li><strong>Name:</strong> ${booking.studentName}</li>
            <li><strong>Email:</strong> <a href="mailto:${booking.studentEmail}">${booking.studentEmail}</a></li>
            <li><strong>Phone:</strong> ${booking.studentPhone || 'Not provided'}</li>
          </ul>
          <p><strong>Session Details:</strong></p>
          <ul>
            <li><strong>Subject:</strong> ${booking.subject}</li>
            <li><strong>Duration:</strong> ${booking.hours} hour(s)</li>
            <li><strong>Payment:</strong> R${booking.amount} (Paid)</li>
            ${booking.slotDate ? `<li><strong>Date:</strong> ${booking.slotDate}</li>` : ''}
            ${booking.slotTime ? `<li><strong>Time:</strong> ${booking.slotTime}</li>` : ''}
            ${booking.meetingLink ? `<li><strong>Your Google Meet Link:</strong> <a href="${booking.meetingLink}">${booking.meetingLink}</a></li>` : ''}
          </ul>
          <p>Please prepare for the session and contact the student if needed.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This email was sent automatically by Be Smart Online Tutorials booking system.</p>
        `,
      });

      if (tutorError) {
        console.error('Failed to send booking notification email to tutor:', tutorError);
      } else {
        console.log('Booking notification email sent to tutor successfully:', tutorData?.id);
      }
    }
  } catch (err) {
    console.error('Error sending booking notification email:', err);
  }
}

// Simple admin session tracking (in production, use proper sessions/JWT)
const adminSessions = new Set<string>();

// Tutor session tracking (maps token -> tutorId)
const tutorSessions = new Map<string, string>();

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

// Clean up past availability slots every hour (Africa/Johannesburg timezone)
setInterval(async () => {
  try {
    const deletedCount = await storage.cleanupPastAvailability();
    if (deletedCount > 0) {
      console.log(`[Cleanup] Removed ${deletedCount} past availability slot(s)`);
    }
  } catch (error) {
    console.error('[Cleanup] Error cleaning up past availability:', error);
  }
}, 60 * 60 * 1000); // Every hour

// Send 24-hour session reminders every 30 minutes
setInterval(async () => {
  try {
    const upcomingSessions = await storage.getUpcomingSessionsForReminders(24);
    
    for (const session of upcomingSessions) {
      // Get tutor info
      const tutor = await storage.getTutorProfileById(session.tutorId);
      if (!tutor) continue;
      
      // Send email reminder to tutor
      const resend = new Resend(process.env.RESEND_API_KEY);
      const sessionDate = session.sessionStartTime ? new Date(session.sessionStartTime).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }) : 'Not specified';
      
      try {
        await resend.emails.send({
          from: 'Be Smart Online Tutorials <bookings@besmartonline.co.za>',
          to: tutor.email,
          subject: `Reminder: Session in 24 hours with ${session.studentName}`,
          html: `
            <h2>Session Reminder</h2>
            <p>Hi ${tutor.fullName},</p>
            <p>This is a reminder that you have an upcoming tutoring session:</p>
            <ul>
              <li><strong>Student:</strong> ${session.studentName} (${session.studentEmail})</li>
              <li><strong>Subject:</strong> ${session.subject || 'Not specified'}</li>
              <li><strong>Date & Time:</strong> ${sessionDate}</li>
              <li><strong>Duration:</strong> ${session.hours} hour(s)</li>
            </ul>
            <p>Please prepare for the session and ensure you're ready on time.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">Be Smart Online Tutorials</p>
          `,
        });
        
        // Mark reminder as sent
        await storage.markReminderSent(session.id);
        console.log(`[Reminder] Sent 24-hour reminder to tutor ${tutor.email} for session with ${session.studentName}`);
      } catch (emailError) {
        console.error(`[Reminder] Failed to send reminder to ${tutor.email}:`, emailError);
      }
    }
  } catch (error) {
    console.error('[Reminder] Error processing session reminders:', error);
  }
}, 30 * 60 * 1000); // Every 30 minutes

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
      console.log("Availability request body:", JSON.stringify(req.body));
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
      // Prevent browser caching
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
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

  // Fixed pricing for Yoco checkout validation
  const YOCO_ALLOWED_PRICING: Record<string, Record<number, number>> = {
    'Maths': { 1: 200, 2: 400 },
    'English': { 1: 200, 2: 400 },
    'History': { 1: 200, 2: 400 },
    'CAT': { 1: 200, 2: 400 },
    'Life Sciences': { 1: 200, 2: 400 },
    'Geography': { 1: 200, 2: 400 },
    'Physical Sciences': { 1: 250, 2: 500 },
    'Afrikaans': { 1: 250, 2: 500 },
  };

  // Create pending booking (for reusable Yoco payment link flow)
  app.post("/api/bookings/create-pending", async (req, res) => {
    try {
      const { tutorId, tutorName, availabilityId, subject, studentName, studentEmail } = req.body;
      const hours = Number(req.body.hours);
      const amount = Number(req.body.amount) || 0;
      
      console.log("Create pending booking:", { tutorId, tutorName, subject, hours, amount, studentName, studentEmail });
      
      // Validate required fields (amount can be 0 for reusable payment link)
      if (!tutorId || !subject || !hours || !studentName || !studentEmail) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: tutorId, subject, hours, studentName, studentEmail",
        });
      }

      // Verify tutor exists
      const tutorProfile = await storage.getTutorProfileById(tutorId);
      if (!tutorProfile) {
        return res.status(404).json({
          success: false,
          message: "Tutor not found",
        });
      }

      // Create booking payment record with 'pending' status
      const bookingPayment = await storage.createBookingPayment({
        tutorId,
        subject,
        hours,
        amount,
        studentName,
        studentEmail,
        paymentStatus: 'pending',
        sessionStartTime: null,
        sessionEndTime: null,
      });

      console.log("Created pending booking:", bookingPayment.id);

      res.json({
        success: true,
        bookingId: bookingPayment.id,
        tutorName: tutorProfile.fullName,
        subject,
        amount,
        message: "Booking created. Please complete payment via Yoco.",
      });
    } catch (error) {
      console.error("Error creating pending booking:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Yoco Payment Integration (legacy - kept for compatibility)
  app.post("/api/yoco/create-checkout", async (req, res) => {
    try {
      const { tutorId, tutorName, availabilityId, subject, studentName, studentEmail, studentPhone } = req.body;
      const hours = Number(req.body.hours);
      const amount = Number(req.body.amount);
      
      console.log("Yoco checkout request:", { tutorId, tutorName, subject, hours, amount, studentName, studentEmail });
      
      // Validate required fields
      if (!tutorId || !subject || !hours || !amount || !studentName || !studentEmail) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: tutorId, subject, hours, amount, studentName, studentEmail",
        });
      }

      // Validate subject against allowed pricing
      if (!YOCO_ALLOWED_PRICING[subject]) {
        return res.status(400).json({
          success: false,
          message: `Invalid subject: ${subject}. Supported subjects: ${Object.keys(YOCO_ALLOWED_PRICING).join(', ')}`,
        });
      }

      // Validate hours (1 or 2)
      if (hours !== 1 && hours !== 2) {
        return res.status(400).json({
          success: false,
          message: "Invalid hours. Only 1 or 2 hours are supported.",
        });
      }

      // Validate amount matches fixed pricing (prevent underpayment attacks)
      const expectedAmount = YOCO_ALLOWED_PRICING[subject][hours];
      if (amount !== expectedAmount) {
        return res.status(400).json({
          success: false,
          message: `Invalid amount. Expected R${expectedAmount} for ${subject} ${hours} hour(s), received R${amount}.`,
        });
      }
      
      const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
      if (!YOCO_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message: "Payment system not configured. Please contact support.",
        });
      }

      // Verify tutor exists
      const tutorProfile = await storage.getTutorProfileById(tutorId);
      if (!tutorProfile) {
        return res.status(404).json({
          success: false,
          message: "Tutor not found",
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

      // Get tutor's profile for meeting link and contact details
      const tutorProfile = await storage.getTutorProfileById(booking.tutorId);
      const meetingLink = tutorProfile?.googleMeetUrl || undefined;

      // Update payment status to completed
      const updatedBooking = await storage.updateBookingPaymentStatus(bookingId, 'completed', meetingLink);

      // Mark availability as booked
      if (booking.availabilityId) {
        await storage.updateAvailability(booking.availabilityId, { isBooked: true });
      }

      // Send booking notification email
      try {
        await sendBookingNotificationEmail({
          studentName: booking.studentName,
          studentEmail: booking.studentEmail,
          studentPhone: booking.studentPhone || null,
          tutorName: tutorProfile?.fullName || 'Unknown Tutor',
          tutorEmail: tutorProfile?.email || null,
          subject: 'Tutoring Session',
          hours: booking.hours,
          amount: booking.amount,
          meetingLink,
        });
      } catch (emailError) {
        console.error('Failed to send booking notification email:', emailError);
      }

      res.json({
        success: true,
        message: "Payment completed successfully",
        booking: updatedBooking,
        meetingLink,
        tutorDetails: tutorProfile ? {
          name: tutorProfile.fullName,
          email: tutorProfile.email,
          phone: tutorProfile.phone,
          googleMeetUrl: tutorProfile.googleMeetUrl,
        } : null,
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
  // Maths, English, History, CAT, Life Sciences, Geography = R200/hr
  // Physical Sciences, Afrikaans = R250/hr
  const ALLOWED_PRICING: Record<string, Record<number, number>> = {
    'Maths': { 1: 200, 2: 400 },
    'English': { 1: 200, 2: 400 },
    'History': { 1: 200, 2: 400 },
    'CAT': { 1: 200, 2: 400 },
    'Life Sciences': { 1: 200, 2: 400 },
    'Geography': { 1: 200, 2: 400 },
    'Physical Sciences': { 1: 250, 2: 500 },
    'Afrikaans': { 1: 250, 2: 500 },
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
          message: "Invalid subject. Supported subjects: Maths, Physical Sciences, English, History, CAT, Life Sciences, Afrikaans.",
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

      // Send booking notification email to admin and tutor
      sendBookingNotificationEmail({
        studentName: normalizedName,
        studentEmail: normalizedEmail,
        studentPhone: studentPhone || null,
        tutorName: tutorProfile?.fullName || 'Unknown Tutor',
        tutorEmail: tutorProfile?.email || null,
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

  // Tutor authentication endpoint (email/password where password = email)
  app.post("/api/tutor/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }
      
      // Verify tutor credentials
      const tutor = await storage.verifyTutorPassword(email, password);
      
      if (tutor) {
        // Check if tutor is blocked
        if (tutor.isBlocked) {
          return res.status(403).json({
            success: false,
            message: "Your account has been blocked. Please contact the administrator.",
          });
        }
        
        // Generate a simple token
        const token = `tutor_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        tutorSessions.set(token, tutor.id);
        
        // Log tutor login
        await storage.createActionLog({
          actionType: 'tutor_login',
          description: `Tutor ${tutor.fullName} logged in`,
          userId: tutor.email,
        });
        
        res.json({
          success: true,
          message: "Login successful",
          token,
          tutor: {
            id: tutor.id,
            email: tutor.email,
            fullName: tutor.fullName,
            isApproved: tutor.isApproved,
          },
        });
      } else {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
    } catch (error) {
      console.error("Error in tutor login:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Tutor logout endpoint
  app.post("/api/tutor/logout", (req, res) => {
    const tutorToken = req.headers['x-tutor-token'] as string;
    if (tutorToken) {
      tutorSessions.delete(tutorToken);
    }
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Get tutor profile by token
  app.get("/api/tutor/profile", async (req, res) => {
    try {
      const tutorToken = req.headers['x-tutor-token'] as string;
      if (!tutorToken || !tutorSessions.has(tutorToken)) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }
      
      const tutorId = tutorSessions.get(tutorToken);
      const tutor = await storage.getTutorProfileById(tutorId!);
      
      if (!tutor) {
        tutorSessions.delete(tutorToken);
        return res.status(401).json({
          success: false,
          message: "Tutor not found",
        });
      }
      
      res.json({
        success: true,
        tutor,
      });
    } catch (error) {
      console.error("Error fetching tutor profile:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Get upcoming sessions for tutor (for in-app notifications)
  app.get("/api/tutor/upcoming-sessions", async (req, res) => {
    try {
      const tutorToken = req.headers['x-tutor-token'] as string;
      if (!tutorToken || !tutorSessions.has(tutorToken)) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }
      
      const tutorId = tutorSessions.get(tutorToken);
      const sessions = await storage.getUpcomingSessionsForTutor(tutorId!);
      
      // Add time until session for each
      const now = new Date();
      const sessionsWithTimeInfo = sessions.map(session => {
        const sessionStart = session.sessionStartTime ? new Date(session.sessionStartTime) : null;
        const hoursUntil = sessionStart ? Math.round((sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60)) : null;
        
        return {
          id: session.id,
          studentName: session.studentName,
          studentEmail: session.studentEmail,
          subject: session.subject,
          hours: session.hours,
          sessionStartTime: session.sessionStartTime,
          sessionEndTime: session.sessionEndTime,
          meetingLink: session.meetingLink,
          hoursUntil,
          isWithin24Hours: hoursUntil !== null && hoursUntil <= 24 && hoursUntil > 0,
        };
      });
      
      res.json({
        success: true,
        sessions: sessionsWithTimeInfo,
      });
    } catch (error) {
      console.error("Error fetching tutor upcoming sessions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Get available (non-booked) slots for a specific tutor (public endpoint)
  app.get("/api/availability/public/:tutorId", async (req, res) => {
    try {
      const { tutorId } = req.params;
      const availabilities = await storage.getAvailabilitiesByTutor(tutorId);
      
      // Get today's date and time in SA timezone
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' });
      
      // Get current time in minutes since midnight (SA timezone)
      const saTimeStr = now.toLocaleTimeString('en-ZA', { 
        timeZone: 'Africa/Johannesburg', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      const [currentHours, currentMinutes] = saTimeStr.split(':').map(Number);
      const currentMinutesSinceMidnight = currentHours * 60 + currentMinutes;
      
      // Helper to parse time string (HH:mm or H:mm) to minutes since midnight
      const parseTimeToMinutes = (timeStr: string): number => {
        if (!timeStr) return 0;
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        return hours * 60 + minutes;
      };
      
      // Filter to only show non-booked, future slots
      const publicSlots = availabilities.filter(slot => {
        // Exclude booked slots - security critical (use truthiness check for any truthy value)
        if (slot.isBooked) return false;
        
        // Exclude past dates
        if (slot.date && slot.date < todayStr) return false;
        
        // Exclude today's slots that have already started (numeric comparison)
        if (slot.date === todayStr && slot.startTime) {
          const slotStartMinutes = parseTimeToMinutes(slot.startTime);
          if (slotStartMinutes <= currentMinutesSinceMidnight) {
            return false;
          }
        }
        
        return true;
      }).map(slot => ({
        // Only expose safe, non-sensitive fields
        id: slot.id,
        date: slot.date,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        notes: slot.notes,
      }));
      
      res.json(publicSlots);
    } catch (error) {
      console.error("Error fetching public availability:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
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

  // Admin endpoint to get currently signed-in tutors
  app.get("/api/admin/active-tutors", requireAdmin, async (req, res) => {
    try {
      // Use Set to deduplicate tutor IDs (a tutor may have multiple active sessions)
      const activeTutorIds = Array.from(new Set(tutorSessions.values()));
      const allTutors = await storage.getAllTutorProfiles();
      
      const activeTutors = allTutors
        .filter(tutor => activeTutorIds.includes(tutor.id))
        .map(tutor => ({
          id: tutor.id,
          fullName: tutor.fullName,
          email: tutor.email,
          phone: tutor.phone,
          subjects: tutor.subjects,
          isApproved: tutor.isApproved,
          isBlocked: tutor.isBlocked,
        }));
      
      res.json(activeTutors);
    } catch (error) {
      console.error("Error fetching active tutors:", error);
      res.status(500).json({ error: "Failed to fetch active tutors" });
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

  // ==================== CHAT API ENDPOINTS ====================

  // Get or create a conversation between a student and tutor
  app.post("/api/chat/conversations", async (req, res) => {
    try {
      const { studentEmail, studentName, tutorId, tutorEmail, tutorName } = req.body;
      
      if (!studentEmail || !studentName || !tutorId || !tutorEmail || !tutorName) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }
      
      const conversation = await storage.getOrCreateConversation(
        studentEmail, studentName, tutorId, tutorEmail, tutorName
      );
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Get conversations for a student
  app.get("/api/chat/conversations/student/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const conversations = await storage.getConversationsByStudentEmail(email);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching student conversations:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Get conversations for a tutor
  app.get("/api/chat/conversations/tutor/:tutorId", async (req, res) => {
    try {
      const { tutorId } = req.params;
      const conversations = await storage.getConversationsByTutorId(tutorId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching tutor conversations:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Get messages for a conversation
  app.get("/api/chat/messages/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await storage.getChatMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Send a message (HTTP fallback if WebSocket is not available)
  app.post("/api/chat/messages", async (req, res) => {
    try {
      const result = insertChatMessageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: fromZodError(result.error).message,
        });
      }
      
      const message = await storage.createChatMessage(result.data);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Mark messages as read
  app.post("/api/chat/messages/:conversationId/read", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { receiverEmail } = req.body;
      
      if (!receiverEmail) {
        return res.status(400).json({
          success: false,
          message: "Missing receiverEmail",
        });
      }
      
      await storage.markMessagesAsRead(conversationId, receiverEmail);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Get unread message count for a user
  app.get("/api/chat/unread/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const count = await storage.getUnreadMessageCount(email);
      res.json({ unreadCount: count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Generate Zoom Video SDK JWT token for embedded meetings
  // Validates that the session is linked to a valid booking
  app.post("/api/zoom/session-token", async (req, res) => {
    try {
      const { sessionName, userName, role = 0, bookingId } = req.body;
      
      if (!sessionName || !userName) {
        return res.status(400).json({
          success: false,
          message: "sessionName and userName are required",
        });
      }
      
      // Validate session name format (must start with bsot-session-)
      if (!sessionName.startsWith('bsot-session-')) {
        return res.status(400).json({
          success: false,
          message: "Invalid session name format",
        });
      }
      
      // For host role (1), validate that the user is a tutor
      if (role === 1) {
        const tutors = await storage.getAllTutorProfiles();
        const isTutor = tutors.some((t: { fullName: string; email?: string | null }) => 
          t.fullName.toLowerCase() === userName.toLowerCase() ||
          t.email?.toLowerCase() === userName.toLowerCase()
        );
        if (!isTutor) {
          return res.status(403).json({
            success: false,
            message: "Only tutors can join as hosts",
          });
        }
      }
      
      if (!process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
        return res.status(500).json({
          success: false,
          message: "Zoom SDK credentials not configured",
        });
      }
      
      const token = generateZoomVideoSDKJWT(
        sessionName,
        role,
        userName
      );
      
      console.log(`[Zoom] Token generated for session: ${sessionName}, user: ${userName}, role: ${role === 1 ? 'host' : 'participant'}`);
      
      res.json({
        success: true,
        token,
        sessionName,
      });
    } catch (error) {
      console.error("Error generating Zoom token:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate session token",
      });
    }
  });

  // ============================================
  // WHATSAPP CLOUD API WEBHOOK
  // ============================================
  
  // In-memory storage for WhatsApp user sessions
  const whatsappSessions: Map<string, { lastMessage: string; timestamp: Date }> = new Map();
  
  const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '906447162558266';
  const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'besmarttutor_webhook_verify';
  
  // Helper function to send WhatsApp message
  async function sendWhatsAppMessage(to: string, message: string) {
    if (!WHATSAPP_ACCESS_TOKEN) {
      console.log('[WhatsApp] Access token not configured, skipping message send');
      return null;
    }
    
    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: { body: message },
          }),
        }
      );
      
      const data = await response.json();
      console.log('[WhatsApp] Message sent:', data);
      return data;
    } catch (error) {
      console.error('[WhatsApp] Error sending message:', error);
      return null;
    }
  }
  
  // WhatsApp Webhook Verification (GET)
  app.get('/api/whatsapp/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('[WhatsApp Webhook] Verification request:', { mode, token });
    
    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
      console.log('[WhatsApp Webhook] Verification successful');
      res.status(200).send(challenge);
    } else {
      console.log('[WhatsApp Webhook] Verification failed');
      res.sendStatus(403);
    }
  });
  
  // WhatsApp Webhook Messages (POST)
  app.post('/api/whatsapp/webhook', async (req, res) => {
    const body = req.body;
    
    console.log('[WhatsApp Webhook] Received:', JSON.stringify(body, null, 2));
    
    // Always return 200 quickly to acknowledge receipt
    res.sendStatus(200);
    
    // Check if this is a WhatsApp webhook event
    if (body.object !== 'whatsapp_business_account') {
      return;
    }
    
    // Process messages
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        
        const value = change.value;
        if (!value.messages) continue;
        
        for (const message of value.messages) {
          const from = message.from;
          const messageType = message.type;
          const messageBody = message.text?.body?.trim() || '';
          
          console.log(`[WhatsApp] Message from ${from}: ${messageBody} (type: ${messageType})`);
          
          // Store user session
          whatsappSessions.set(from, {
            lastMessage: messageBody,
            timestamp: new Date(),
          });
          
          // Handle message based on content
          let replyMessage = '';
          
          if (messageBody === '1') {
            // Payment option
            replyMessage = `Please use the payment link below:\nhttps://pay.yoco.com/smart-tutor1\n\nTo proceed, send your proof of payment to:\nonlinepresenceimpact@gmail.com`;
          } else if (messageBody === '2') {
            // Book a tutor option
            replyMessage = `To view available tutors and book a session, please visit:\nhttps://smarttutorclone.com/`;
          } else if (messageBody === '3') {
            // Ask a question option
            replyMessage = `Please type your question below.\nOne of our agents will contact you shortly.`;
          } else {
            // Default welcome message for any other message
            replyMessage = `Welcome to Online Be Smart Tutoring 👋\nWe are available and looking to book a tutor.\n\nPlease choose an option:\n1️⃣ Make a payment\n2️⃣ Book a tutor\n3️⃣ Ask a question`;
          }
          
          // Send reply
          await sendWhatsAppMessage(from, replyMessage);
        }
      }
    }
  });

  const httpServer = createServer(app);

  // Setup WebSocket server for real-time chat
  setupWebSocketServer(httpServer);

  return httpServer;
}
