import { z } from 'zod';
import { validateRequest } from './validate.js';

export const articleQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(50, Math.max(1, parseInt(val, 10) || 10)) : 10)),
  category: z.string().trim().max(100).optional(),
  search: z.string().trim().max(200).optional(),
});

export const articleSlugSchema = z.object({
  slug: z
    .string({ required_error: 'Article slug is required' })
    .trim()
    .min(2, { message: 'Slug must be at least 2 characters long' })
    .max(255, { message: 'Slug cannot exceed 255 characters' }),
});

export const validateArticleQuery = validateRequest({ query: articleQuerySchema });
export const validateArticleSlug = validateRequest({ params: articleSlugSchema });
