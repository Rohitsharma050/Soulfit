import { z } from 'zod';
import { validateRequest } from './validate.js';

export const subscribeSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .toLowerCase()
    .email({ message: 'Please provide a valid email address' })
    .max(255, { message: 'Email cannot exceed 255 characters' }),
  consent: z
    .boolean({ required_error: 'Explicit consent is required' })
    .refine((val) => val === true, {
      message: 'You must provide consent to receive the Cosmic & Wellness Digest',
    }),
});

export const unsubscribeSchema = z.object({
  token: z
    .string({ required_error: 'Unsubscribe token is required' })
    .trim()
    .min(10, { message: 'Invalid or malformed unsubscribe token' }),
});

export const validateSubscribe = validateRequest({ body: subscribeSchema });
export const validateUnsubscribe = validateRequest({ body: unsubscribeSchema });
