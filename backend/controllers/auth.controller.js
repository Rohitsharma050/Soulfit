/**
 * Auth Controller (Scaffold for Future Phase)
 * Full Google OAuth 2.0 and JWT session management will be implemented in Phase 5.
 */

export const getAuthStatus = async (req, res, next) => {
  try {
    return res.status(200).json({
      status: 'success',
      data: {
        authenticated: false,
        message: 'Authentication module scaffolded. Full Google OAuth 2.0 integration scheduled for Phase 5.',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuthCallback = async (req, res, next) => {
  return res.status(501).json({
    status: 'fail',
    message: 'Google OAuth callback handler will be implemented in Phase 5.',
  });
};
