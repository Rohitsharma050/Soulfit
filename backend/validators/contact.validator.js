import { z } from 'zod';
import { validateRequest } from './validate.js';

export const createContactSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(150, { message: 'Name cannot exceed 150 characters' }),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email({ message: 'Please provide a valid email address' })
    .max(255, { message: 'Email cannot exceed 255 characters' }),
  phone: z
    .string()
    .trim()
    .max(20, { message: 'Phone number cannot exceed 20 characters' })
    .optional()
    .or(z.literal('')),
  subject: z
    .string()
    .trim()
    .max(200, { message: 'Subject cannot exceed 200 characters' })
    .optional()
    .or(z.literal('')),
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(5, { message: 'Message must be at least 5 characters long' })
    .max(3000, { message: 'Message cannot exceed 3000 characters' }),
  // Honeypot field for spam bots - must be empty or undefined
  website: z
    .string()
    .optional()
    .refine((val) => !val || val.trim() === '', {
      message: 'Spam submission detected',
    }),
});

export const validateContactSubmission = validateRequest({ body: createContactSchema });
