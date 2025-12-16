const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const sendError = (status, error, details = null) => {
        res.status(status).json({
            success: false,
            error,
            details
        });
    };

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return sendError(400, 'Ошибка валидации', errors);
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return sendError(400, 'Дублирование данных', `${field} уже существует`);
    }

    if (err.name === 'JsonWebTokenError') {
        return sendError(401, 'Ошибка авторизации', 'Неверный токен');
    }

    if (err.name === 'TokenExpiredError') {
        return sendError(401, 'Ошибка авторизации', 'Токен истёк');
    }

    sendError(err.status || 500, err.message || 'Внутренняя ошибка сервера');
};

module.exports = errorHandler;