import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertAppointmentSchema, insertAvailabilitySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);

  return httpServer;
}
