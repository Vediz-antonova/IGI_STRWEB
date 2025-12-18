const express = require('express');
const router = express.Router();
const {
    getAllPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase,
    getPurchaseStats
} = require('../controllers/purchaseController');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', auth, getAllPurchases);
router.get('/stats', auth, getPurchaseStats);
router.get('/:id', auth, getPurchaseById);

router.put('/:id', auth, isAdmin, updatePurchase);
router.delete('/:id', auth, isAdmin, deletePurchase);

module.exports = router;