import { prisma } from '../config/prisma.js';
import { createPrismaPgAdapter } from '../config/prismaAdapter.js';

const ARTICLE_LIST_SELECT_FIELDS = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  cover_image: true,
  category: true,
  author_name: true,
  reading_time: true,
  published_at: true,
  created_at: true,
};

const ARTICLE_DETAIL_SELECT_FIELDS = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  cover_image: true,
  category: true,
  author_name: true,
  reading_time: true,
  status: true,
  published_at: true,
  created_at: true,
  updated_at: true,
};

export class ArticleRepository {
  /**
   * Initializes the repository with Prisma Client.
   * If a custom client is supplied (e.g. pg-mem pool during automated tests),
   * it adapts it to provide Prisma model delegates.
   * @param {Object} [client=prisma] - PrismaClient instance or test adapter
   */
  constructor(client = prisma) {
    this.prisma =
      client && typeof client.query === 'function' && !client.articles
        ? createPrismaPgAdapter(client)
        : client;
  }

  /**
   * Fetches published articles with pagination, category filter, and search.
   * Excludes the heavy 'content' column for listing performance.
   * @param {Object} options - { page, limit, category, search }
   * @returns {Promise<{ articles: Array, totalCount: number, page: number, limit: number, totalPages: number }>}
   */
  async findPublished({ page = 1, limit = 10, category = null, search = null }) {
    const where = {
      status: 'PUBLISHED',
    };

    if (category && category !== 'ALL') {
      where.category = {
        equals: category,
        mode: 'insensitive',
      };
    }

    if (search && search.trim() !== '') {
      const trimmedSearch = search.trim();
      where.OR = [
        {
          title: {
            contains: trimmedSearch,
            mode: 'insensitive',
          },
        },
        {
          excerpt: {
            contains: trimmedSearch,
            mode: 'insensitive',
          },
        },
      ];
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [totalCount, articles] = await Promise.all([
      this.prisma.articles.count({ where }),
      this.prisma.articles.findMany({
        where,
        select: ARTICLE_LIST_SELECT_FIELDS,
        orderBy: [
          { published_at: 'desc' },
          { created_at: 'desc' },
        ],
        skip,
        take,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      articles,
      totalCount,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Fetches an individual published article by unique slug, including full content.
   * Returns null if not found or if the article is unpublished (DRAFT / ARCHIVED).
   * @param {string} slug 
   * @returns {Promise<Object|null>}
   */
  async findBySlug(slug) {
    if (!slug) return null;

    const article = await this.prisma.articles.findFirst({
      where: {
        slug: {
          equals: slug,
          mode: 'insensitive',
        },
        status: 'PUBLISHED',
      },
      select: ARTICLE_DETAIL_SELECT_FIELDS,
    });

    return article || null;
  }
}

export const articleRepository = new ArticleRepository();
export default articleRepository;
