const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            error: 'Дублирование данных',
            message: `${field} уже существует`
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Неверный токен' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Токен истек' });
    }

    res.status(err.status || 500).json({
        error: err.message || 'Внутренняя ошибка сервера'
    });
};

module.exports = errorHandler;