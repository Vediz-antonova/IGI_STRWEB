const express = require('express');
const router = express.Router();
const {
    getAllPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    deletePurchase,
    updatePurchaseStatus,
    getPurchaseStats,
    getUpcomingDeliveries,
    createBulkPurchases
} = require('../controllers/purchaseController');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', auth, getAllPurchases);
router.get('/stats', auth, getPurchaseStats);
router.get('/upcoming', auth, getUpcomingDeliveries);
router.get('/:id', auth, getPurchaseById);

router.post('/', auth, createPurchase);
router.post('/bulk', auth, createBulkPurchases);
router.put('/:id', auth, isAdmin, updatePurchase);
router.patch('/:id/status', auth, isAdmin, updatePurchaseStatus);
router.delete('/:id', auth, isAdmin, deletePurchase);

module.exports = router;