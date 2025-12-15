const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProductStats
} = require('../controllers/productController');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/:id', getProductById);

router.get('/stats/stats', auth, getProductStats);

router.post('/', auth, isAdmin, createProduct);
router.put('/:id', auth, isAdmin, updateProduct);
router.delete('/:id', auth, isAdmin, deleteProduct);

module.exports = router;