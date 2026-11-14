import { articleService } from '../services/article.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getArticles = asyncHandler(async (req, res) => {
  const { page, limit, category, search } = req.query;
  const result = await articleService.getPublishedArticles({ page, limit, category, search });

  return ApiResponse.success(
    res,
    result.articles,
    'Published articles retrieved successfully',
    200,
    {
      totalCount: result.totalCount,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    }
  );
});

export const getArticleBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const article = await articleService.getArticleBySlug(slug);

  return ApiResponse.success(res, article, 'Article content retrieved successfully');
});

export default {
  getArticles,
  getArticleBySlug,
};
