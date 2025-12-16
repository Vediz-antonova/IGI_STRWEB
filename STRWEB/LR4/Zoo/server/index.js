require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const errorHandler = require('./utils/errorHandler');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const priceChangeRoutes = require('./routes/priceChangeRoutes');

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/price-changes', priceChangeRoutes);

app.get('/api', (req, res) => {
    res.json({
        name: 'Zoo Shop API',
        version: '1.0.0',
        description: 'API для управления зоомагазином',
        documentation: 'Все запросы требуют авторизации, кроме публичных маршрутов',
        publicRoutes: [
            'GET /api/products',
            'GET /api/products/:id',
            'GET /api/products/search',
            'GET /api/suppliers',
            'GET /api/suppliers/:id',
            'GET /api/suppliers/city/:city',
            'GET /api/price-changes',
            'GET /api/price-changes/upcoming',
            'GET /api/price-changes/product/:productId/history',
            'POST /api/auth/register',
            'POST /api/auth/login'
        ],
        protectedRoutes: 'Требуют заголовок Authorization: Bearer <token>'
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        availableRoutes: [
            '/api',
            '/api/health',
            '/api/auth',
            '/api/products',
            '/api/suppliers',
            '/api/purchases',
            '/api/price-changes'
        ]
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`MongoDB Admin: http://localhost:8081`);
    console.log(`API Documentation: http://localhost:${PORT}/api`);
});