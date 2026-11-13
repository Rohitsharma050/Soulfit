/**
 * Consultation Controller (Scaffold for Future Phase)
 * Full consultation booking, slot management, and concurrency locking will be implemented in Phase 6.
 */

export const listConsultations = async (req, res, next) => {
  try {
    return res.status(200).json({
      status: 'success',
      data: {
        consultations: [],
        message: 'Consultation booking system scaffolded. Concurrency-protected booking APIs scheduled for Phase 6.',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createConsultation = async (req, res, next) => {
  return res.status(501).json({
    status: 'fail',
    message: 'Consultation booking creation with slot-locking will be implemented in Phase 6.',
  });
};
