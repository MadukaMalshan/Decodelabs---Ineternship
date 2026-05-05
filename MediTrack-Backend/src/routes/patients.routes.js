// src/routes/patients.routes.js
const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/patients.controller');

// GET /api/v1/patients — Admin & Doctor only
router.get('/', requireAuth('admin', 'doctor'), ctrl.getAllPatients);

// GET /api/v1/patients/:id — Admin, Doctor, or patient themselves
router.get('/:id', requireAuth('admin', 'doctor', 'patient'), ctrl.getPatientById);

// GET /api/v1/patients/:id/appointments
router.get('/:id/appointments', requireAuth('admin', 'doctor', 'patient'), ctrl.getPatientAppointments);

// GET /api/v1/patients/:id/prescriptions
router.get('/:id/prescriptions', requireAuth('admin', 'doctor', 'patient'), ctrl.getPatientPrescriptions);

// GET /api/v1/patients/:id/inpatient
router.get('/:id/inpatient', requireAuth('admin', 'doctor', 'patient'), ctrl.getPatientInpatientStatus);

module.exports = router;
