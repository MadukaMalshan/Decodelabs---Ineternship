// src/routes/inventory.routes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { requireAuth } = require('../middleware/auth.middleware');
const { runValidation } = require('../middleware/validate.middleware');
const ctrl = require('../controllers/inventory.controller');

const inventoryCreateRules = [
    body('item_name').notEmpty().trim().withMessage('item_name is required.'),
    body('category').notEmpty().withMessage('category is required.'),
    body('quantity_in_stock').isInt({ min: 0 }).withMessage('quantity_in_stock must be a non-negative integer.'),
    body('unit_of_measure').notEmpty().withMessage('unit_of_measure is required (e.g., pieces, bottles, boxes).'),
    body('reorder_level').isInt({ min: 1 }).withMessage('reorder_level must be a positive integer.')
];

// GET /api/v1/inventory — Admin & Doctor can monitor
router.get('/', requireAuth('admin', 'doctor'), ctrl.getAllInventory);

// GET /api/v1/inventory/:id
router.get('/:id', requireAuth('admin', 'doctor'), ctrl.getInventoryById);

// POST /api/v1/inventory — Admin only
router.post('/', requireAuth('admin'), inventoryCreateRules, runValidation, ctrl.createInventoryItem);

// PUT /api/v1/inventory/:id — Admin only
router.put('/:id',
    requireAuth('admin'),
    [body('quantity_in_stock').optional().isInt({ min: 0 }).withMessage('quantity_in_stock must be a non-negative integer.')],
    runValidation,
    ctrl.updateInventoryItem
);

// DELETE /api/v1/inventory/:id — Admin only
router.delete('/:id', requireAuth('admin'), ctrl.deleteInventoryItem);

module.exports = router;
