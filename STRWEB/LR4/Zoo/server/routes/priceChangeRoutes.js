const express = require('express');
const router = express.Router();
const {
    getAllPriceChanges,
    getPriceChangeById,
    createPriceChange,
    updatePriceChange,
    deletePriceChange,
    markAsNotified,
    getUpcomingPriceChanges,
    getProductPriceHistory,
    applyPendingPriceChanges
} = require('../controllers/priceChangeController');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', getAllPriceChanges);
router.get('/upcoming', getUpcomingPriceChanges);
router.get('/product/:productId/history', getProductPriceHistory);
router.get('/:id', getPriceChangeById);

router.patch('/:id/notify', auth, markAsNotified);
router.post('/apply-pending', auth, isAdmin, applyPendingPriceChanges);

router.post('/', auth, isAdmin, createPriceChange);
router.put('/:id', auth, isAdmin, updatePriceChange);
router.delete('/:id', auth, isAdmin, deletePriceChange);

module.exports = router;