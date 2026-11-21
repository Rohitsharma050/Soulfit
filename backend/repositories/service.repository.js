import { prisma } from '../config/prisma.js';
import { createPrismaPgAdapter } from '../config/prismaAdapter.js';

const SERVICE_SELECT_FIELDS = {
  id: true,
  slug: true,
  title: true,
  category: true,
  short_description: true,
  description: true,
  image_url: true,
  icon_name: true,
  offerings: true,
  is_featured: true,
  display_order: true,
  created_at: true,
  updated_at: true,
};

export class ServiceRepository {
  /**
   * Initializes the repository with Prisma Client.
   * If a custom client is supplied (e.g. pg-mem pool during automated tests),
   * it adapts it to provide Prisma model delegates.
   * @param {Object} [client=prisma] - PrismaClient instance or test adapter
   */
  constructor(client = prisma) {
    this.prisma =
      client && typeof client.query === 'function' && !client.services
        ? createPrismaPgAdapter(client)
        : client;
  }

  /**
   * Fetches all active services with optional filtering.
   * @param {Object} filters - Optional filters: { category, featured }
   * @returns {Promise<Array>} List of active services
   */
  async findAllActive(filters = {}) {
    const where = {
      is_active: true,
    };

    if (filters.category) {
      where.category = {
        equals: filters.category,
        mode: 'insensitive',
      };
    }

    if (filters.featured !== undefined) {
      const isFeatured =
        typeof filters.featured === 'string'
          ? filters.featured.toLowerCase() === 'true'
          : Boolean(filters.featured);
      where.is_featured = isFeatured;
    }

    return await this.prisma.services.findMany({
      where,
      select: SERVICE_SELECT_FIELDS,
      orderBy: [
        { display_order: 'asc' },
        { title: 'asc' },
      ],
    });
  }

  /**
   * Fetches an active service by its unique slug.
   * @param {string} slug 
   * @returns {Promise<Object|null>}
   */
  async findBySlug(slug) {
    if (!slug) return null;

    const service = await this.prisma.services.findFirst({
      where: {
        slug: {
          equals: slug,
          mode: 'insensitive',
        },
        is_active: true,
      },
      select: SERVICE_SELECT_FIELDS,
    });

    return service || null;
  }
}

export const serviceRepository = new ServiceRepository();
export default serviceRepository;
