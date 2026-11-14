import { contactService } from '../services/contact.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createContact = asyncHandler(async (req, res) => {
  const result = await contactService.submitInquiry(req.body);

  return ApiResponse.created(
    res,
    result,
    'Your inquiry has been received. Our guidance team will connect with you within 24 to 48 hours.'
  );
});

export default {
  createContact,
};
