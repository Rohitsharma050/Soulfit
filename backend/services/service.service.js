import { serviceRepository } from '../repositories/service.repository.js';
import { ApiError } from '../utils/ApiError.js';

export class ServiceService {
  constructor(repo = serviceRepository) {
    this.repo = repo;
  }

  /**
   * Retrieves all active services, optionally filtered by category or featured status.
   */
  async getAllServices(filters = {}) {
    return await this.repo.findAllActive(filters);
  }

  /**
   * Retrieves an active service by unique slug.
   * Throws 404 ApiError if not found or inactive.
   */
  async getServiceBySlug(slug) {
    if (!slug) {
      throw ApiError.badRequest('Service slug is required');
    }

    const service = await this.repo.findBySlug(slug);
    if (!service) {
      throw ApiError.notFound(`Service with slug "${slug}" was not found or is currently inactive.`);
    }

    return service;
  }
}

export const serviceService = new ServiceService();
export default serviceService;
