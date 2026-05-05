// src/controllers/inventory.controller.js
// Refactored for PostgreSQL with parameterized queries
const db = require('../db/pool');
const { createError, sendSuccess } = require('../middleware/errorHandler');

const VALID_CATEGORIES = ['PPE', 'Hygiene', 'Pharmacy', 'Supplies', 'Equipment', 'Other'];
const VALID_STATUSES   = ['Good', 'Low', 'Critical'];

/**
 * GET /api/v1/inventory
 * Query params: ?category=&status=
 */
const getAllInventory = async (req, res, next) => {
    try {
        const { category, status } = req.query;
        let query = `
            SELECT 
                id, item_name AS item, category, quantity_in_stock AS stock, 
                unit_of_measure AS unit, status, supplier, unit_cost, expiry_date,
                batch_number, location_in_warehouse, last_restocked, created_at, updated_at
            FROM inventory
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (category) {
            query += ` AND category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }
        if (status) {
            query += ` AND status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        query += ` ORDER BY item_name ASC`;
        
        const result = await db.queryMany(query, params);
        sendSuccess(res, 200, `Retrieved ${result.length} inventory item(s).`, result);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/v1/inventory/:id
 */
const getInventoryById = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                id, item_name AS item, category, quantity_in_stock AS stock, 
                unit_of_measure AS unit, status, supplier, unit_cost, expiry_date,
                batch_number, location_in_warehouse, last_restocked, created_at, updated_at
            FROM inventory
            WHERE id = $1
        `;
        
        const item = await db.queryOne(query, [req.params.id]);
        if (!item) return next(createError(404, `Inventory item '${req.params.id}' not found.`));
        
        sendSuccess(res, 200, 'Inventory item retrieved.', item);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/inventory — Admin only
 * Body: { item_name, category, quantity_in_stock, unit_of_measure, reorder_level, status?, supplier?, unit_cost? }
 * Uses parameterized query - prevents SQL injection
 */
const createInventoryItem = async (req, res, next) => {
    try {
        const { item_name, category, quantity_in_stock, unit_of_measure, reorder_level, status, supplier, unit_cost } = req.body;

        // Validate required fields
        if (!item_name || !category || quantity_in_stock === undefined || !unit_of_measure || !reorder_level) {
            return next(createError(400, 'Required fields: item_name, category, quantity_in_stock, unit_of_measure, reorder_level'));
        }

        // Validate category
        if (!VALID_CATEGORIES.includes(category)) {
            return next(createError(400, `Invalid category. Must be: [${VALID_CATEGORIES.join(', ')}]`));
        }

        // Determine status based on stock level if not provided
        let finalStatus = status;
        if (!finalStatus) {
            if (quantity_in_stock <= 0) finalStatus = 'Critical';
            else if (quantity_in_stock <= reorder_level) finalStatus = 'Low';
            else finalStatus = 'Good';
        }

        // Insert with parameterized query
        const query = `
            INSERT INTO inventory 
            (item_name, category, quantity_in_stock, unit_of_measure, reorder_level, status, supplier, unit_cost)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING 
                id, item_name AS item, category, quantity_in_stock AS stock,
                unit_of_measure AS unit, status, reorder_level, supplier, unit_cost, created_at
        `;

        const newItem = await db.insert(query, [
            item_name,
            category,
            quantity_in_stock,
            unit_of_measure,
            reorder_level,
            finalStatus,
            supplier || null,
            unit_cost || null
        ]);

        sendSuccess(res, 201, 'Inventory item added successfully.', newItem);
    } catch (err) {
        if (err.code === '23505') { // Unique constraint
            return next(createError(400, 'An inventory item with this name already exists.'));
        }
        next(err);
    }
};

/**
 * PUT /api/v1/inventory/:id — Admin only
 * Body: any updatable fields
 * Uses parameterized query
 */
const updateInventoryItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { item_name, category, quantity_in_stock, unit_of_measure, reorder_level, status, supplier, unit_cost, batch_number, location_in_warehouse, last_restocked } = req.body;

        // Check if item exists
        const item = await db.queryOne('SELECT id FROM inventory WHERE id = $1', [id]);
        if (!item) return next(createError(404, `Inventory item '${id}' not found.`));

        // Build dynamic update query
        const updates = [];
        const params = [];
        let paramCount = 1;

        if (item_name !== undefined) {
            updates.push(`item_name = $${paramCount}`);
            params.push(item_name);
            paramCount++;
        }
        if (category !== undefined) {
            updates.push(`category = $${paramCount}`);
            params.push(category);
            paramCount++;
        }
        if (quantity_in_stock !== undefined) {
            updates.push(`quantity_in_stock = $${paramCount}`);
            params.push(quantity_in_stock);
            paramCount++;

            // Auto-calculate status from stock if not explicitly provided
            if (status === undefined) {
                let autoStatus = 'Good';
                if (quantity_in_stock <= 0) autoStatus = 'Critical';
                else if (quantity_in_stock <= (req.body.reorder_level || 100)) autoStatus = 'Low';
                updates.push(`status = '${autoStatus}'`);
            }
        }
        if (unit_of_measure !== undefined) {
            updates.push(`unit_of_measure = $${paramCount}`);
            params.push(unit_of_measure);
            paramCount++;
        }
        if (reorder_level !== undefined) {
            updates.push(`reorder_level = $${paramCount}`);
            params.push(reorder_level);
            paramCount++;
        }
        if (status !== undefined) {
            updates.push(`status = $${paramCount}`);
            params.push(status);
            paramCount++;
        }
        if (supplier !== undefined) {
            updates.push(`supplier = $${paramCount}`);
            params.push(supplier);
            paramCount++;
        }
        if (unit_cost !== undefined) {
            updates.push(`unit_cost = $${paramCount}`);
            params.push(unit_cost);
            paramCount++;
        }
        if (batch_number !== undefined) {
            updates.push(`batch_number = $${paramCount}`);
            params.push(batch_number);
            paramCount++;
        }
        if (location_in_warehouse !== undefined) {
            updates.push(`location_in_warehouse = $${paramCount}`);
            params.push(location_in_warehouse);
            paramCount++;
        }
        if (last_restocked !== undefined) {
            updates.push(`last_restocked = $${paramCount}`);
            params.push(last_restocked);
            paramCount++;
        }

        if (updates.length === 0) {
            return next(createError(400, 'No fields to update'));
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `
            UPDATE inventory
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, item_name AS item, category, quantity_in_stock AS stock, unit_of_measure AS unit, status, updated_at
        `;

        const updated = await db.queryOne(query, params);
        sendSuccess(res, 200, 'Inventory item updated.', updated);
    } catch (err) {
        if (err.code === '23505') {
            return next(createError(400, 'An inventory item with this name already exists.'));
        }
        next(err);
    }
};

/**
 * DELETE /api/v1/inventory/:id — Admin only
 * Uses parameterized query
 */
const deleteInventoryItem = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if item exists
        const item = await db.queryOne('SELECT id, item_name FROM inventory WHERE id = $1', [id]);
        if (!item) return next(createError(404, `Inventory item '${id}' not found.`));

        // Delete with parameterized query
        await db.query('DELETE FROM inventory WHERE id = $1', [id]);
        
        sendSuccess(res, 200, `Inventory item '${item.item_name}' removed.`, null);
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllInventory, getInventoryById, createInventoryItem, updateInventoryItem, deleteInventoryItem };
