import { serviceService } from '../services/service.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getServices = asyncHandler(async (req, res) => {
  const { category, featured } = req.query;
  const services = await serviceService.getAllServices({ category, featured });

  return ApiResponse.success(res, services, 'Services retrieved successfully', 200, {
    count: services.length,
  });
});

export const getServiceBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const service = await serviceService.getServiceBySlug(slug);

  return ApiResponse.success(res, service, 'Service details retrieved successfully');
});

export default {
  getServices,
  getServiceBySlug,
};
