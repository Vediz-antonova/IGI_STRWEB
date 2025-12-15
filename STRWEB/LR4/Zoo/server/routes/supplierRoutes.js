const express = require('express');
const router = express.Router();
const {
    getAllSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierStats,
    getSupplierPurchases,
    getSuppliersByCity
} = require('../controllers/supplierController');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', getAllSuppliers);
router.get('/city/:city', getSuppliersByCity);
router.get('/:id', getSupplierById);

router.get('/:id/stats', auth, getSupplierStats);
router.get('/:id/purchases', auth, getSupplierPurchases);

router.post('/', auth, isAdmin, createSupplier);
router.put('/:id', auth, isAdmin, updateSupplier);
router.delete('/:id', auth, isAdmin, deleteSupplier);

module.exports = router;