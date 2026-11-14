import { articleRepository } from '../repositories/article.repository.js';
import { ApiError } from '../utils/ApiError.js';

export class ArticleService {
  constructor(repo = articleRepository) {
    this.repo = repo;
  }

  /**
   * Retrieves paginated published articles with optional category and search filters.
   */
  async getPublishedArticles({ page = 1, limit = 10, category = null, search = null }) {
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const validLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    return await this.repo.findPublished({
      page: validPage,
      limit: validLimit,
      category: category ? category.trim() : null,
      search: search ? search.trim() : null,
    });
  }

  /**
   * Retrieves an individual published article by unique slug.
   * Throws 404 ApiError if the article is unpublished or does not exist.
   */
  async getArticleBySlug(slug) {
    if (!slug) {
      throw ApiError.badRequest('Article slug is required');
    }

    const article = await this.repo.findBySlug(slug);
    if (!article) {
      throw ApiError.notFound(`Article with slug "${slug}" was not found or has not yet been published.`);
    }

    return article;
  }
}

export const articleService = new ArticleService();
export default articleService;
