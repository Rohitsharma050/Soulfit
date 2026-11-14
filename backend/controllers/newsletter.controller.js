import { newsletterService } from '../services/newsletter.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const subscribe = asyncHandler(async (req, res) => {
  const { email, consent } = req.body;
  const result = await newsletterService.subscribe({ email, consent });

  const statusCode = result.alreadySubscribed ? 200 : 201;
  return ApiResponse.success(res, result, result.message, statusCode);
});

export const unsubscribe = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const result = await newsletterService.unsubscribe(token);

  return ApiResponse.success(res, result, result.message, 200);
});

export default {
  subscribe,
  unsubscribe,
};
