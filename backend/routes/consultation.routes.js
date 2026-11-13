import { Router } from 'express';
import { listConsultations, createConsultation } from '../controllers/consultation.controller.js';

const router = Router();

// GET /api/v1/consultations
router.get('/', listConsultations);

// POST /api/v1/consultations
router.post('/', createConsultation);

export default router;
