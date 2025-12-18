const express = require('express');
const router = express.Router();
const {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    getOrderStats,
    getUpcomingDeliveries,
    createBulkOrders
} = require('../controllers/orderController');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', auth, getAllOrders);
router.get('/stats', auth, getOrderStats);
router.get('/upcoming', auth, getUpcomingDeliveries);
router.get('/:id', auth, getOrderById);
router.post('/bulk', auth, createBulkOrders);

router.post('/', auth, createOrder);
router.put('/:id', auth, isAdmin, updateOrder);
router.patch('/:id/status', auth, isAdmin, updateOrderStatus);
router.delete('/:id', auth, isAdmin, deleteOrder);

module.exports = router;