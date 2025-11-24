import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form submission endpoint
  // POST /api/contact - Submit a contact form message
  app.post("/api/contact", async (req, res) => {
    try {
      // Validate the request body using Zod schema
      const validatedData = insertContactSchema.parse(req.body);
      
      // Store the contact submission
      const submission = await storage.createContactSubmission(validatedData);
      
      // Return success response
      res.status(201).json({
        success: true,
        message: "Contact form submitted successfully",
        id: submission.id,
      });
    } catch (error: any) {
      // Handle validation errors
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationError.message,
        });
      }
      
      // Handle other errors
      console.error("Error submitting contact form:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Optional: Get all contact submissions (for admin/debugging)
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

  const httpServer = createServer(app);

  return httpServer;
}
