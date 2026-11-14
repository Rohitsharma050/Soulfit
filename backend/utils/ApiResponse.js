/**
 * Standardized API Response Structure
 * Conforms to { success: true, message: '...', data: {}, meta?: {} }
 */
export class ApiResponse {
  constructor(statusCode, data = null, message = 'Operation completed successfully', meta = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
  }

  static success(res, data = null, message = 'Operation completed successfully', statusCode = 200, meta = null) {
    const payload = new ApiResponse(statusCode, data, message, meta);
    return res.status(statusCode).json(payload);
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }
}

export default ApiResponse;
