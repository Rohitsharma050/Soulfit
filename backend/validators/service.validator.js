import { z } from 'zod';
import { validateRequest } from './validate.js';

export const serviceQuerySchema = z.object({
  category: z.string().trim().max(100).optional(),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
});

export const serviceSlugSchema = z.object({
  slug: z
    .string({ required_error: 'Service slug is required' })
    .trim()
    .min(2, { message: 'Slug must be at least 2 characters long' })
    .max(150, { message: 'Slug cannot exceed 150 characters' }),
});

export const validateServiceQuery = validateRequest({ query: serviceQuerySchema });
export const validateServiceSlug = validateRequest({ params: serviceSlugSchema });
