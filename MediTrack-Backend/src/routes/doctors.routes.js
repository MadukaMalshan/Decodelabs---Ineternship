// src/routes/doctors.routes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { requireAuth } = require('../middleware/auth.middleware');
const { runValidation } = require('../middleware/validate.middleware');
const ctrl = require('../controllers/doctors.controller');

// ─── Validation Rules ─────────────────────────────────────────────────────────
const doctorCreateRules = [
    body('name').notEmpty().trim().withMessage('name is required.'),
    body('specialty').notEmpty().withMessage('specialty ID is required.'),
    body('shift')
        .notEmpty().withMessage('shift is required.')
        .isIn(['Morning', 'Evening', 'Night']).withMessage("shift must be: ['Morning', 'Evening', 'Night']."),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number format.')
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/v1/doctors/specialties — public (no auth needed for patient booking)
router.get('/specialties', ctrl.getSpecialties);

// GET /api/v1/doctors  — All authenticated users
router.get('/', requireAuth('admin', 'doctor', 'patient'), ctrl.getAllDoctors);

// GET /api/v1/doctors/:id
router.get('/:id', requireAuth('admin', 'doctor', 'patient'), ctrl.getDoctorById);

// POST /api/v1/doctors — Admin only
router.post('/',
    requireAuth('admin'),
    doctorCreateRules,
    runValidation,
    ctrl.createDoctor
);

// PUT /api/v1/doctors/:id — Admin only (full profile update)
router.put('/:id',
    requireAuth('admin'),
    [
        body('name').optional().notEmpty().trim().withMessage('name cannot be empty.'),
        body('email').optional().isEmail().withMessage('A valid email is required.'),
        body('shift').optional().isIn(['Morning', 'Evening', 'Night']).withMessage('Invalid shift.')
    ],
    runValidation,
    ctrl.updateDoctor
);

// PUT /api/v1/doctors/:id/status — Availability toggle (Doctor updates own, Admin updates any)
router.put('/:id/status',
    requireAuth('admin', 'doctor'),
    [body('status').notEmpty().withMessage('status is required.')],
    runValidation,
    ctrl.updateDoctorStatus
);

// DELETE /api/v1/doctors/:id — Admin only
router.delete('/:id', requireAuth('admin'), ctrl.deleteDoctor);

module.exports = router;
