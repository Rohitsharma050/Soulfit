import { contactRepository } from '../repositories/contact.repository.js';
import { ApiError } from '../utils/ApiError.js';

export class ContactService {
  constructor(repo = contactRepository) {
    this.repo = repo;
  }

  /**
   * Processes and persists a validated client contact submission.
   * Enforces honeypot spam protection and normalization.
   */
  async submitInquiry(contactData) {
    // 1. Honeypot verification (website field must be empty)
    if (contactData.website && contactData.website.trim() !== '') {
      throw ApiError.badRequest('Automated submission rejected');
    }

    // 2. Normalization
    const normalizedData = {
      name: contactData.name.trim(),
      email: contactData.email.trim().toLowerCase(),
      phone: contactData.phone ? contactData.phone.trim() : null,
      subject: contactData.subject ? contactData.subject.trim() : 'General Sanctuary Inquiry',
      message: contactData.message.trim(),
    };

    // 3. Persist in database
    const savedRecord = await this.repo.create(normalizedData);

    return {
      id: savedRecord.id,
      name: savedRecord.name,
      email: savedRecord.email,
      subject: savedRecord.subject,
      status: savedRecord.status,
      createdAt: savedRecord.created_at,
    };
  }
}

export const contactService = new ContactService();
export default contactService;
