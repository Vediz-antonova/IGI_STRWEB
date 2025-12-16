const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Токен отсутствует' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Пользователь не найден' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Срок действия токена истёк' });
        }
        res.status(401).json({ success: false, message: 'Недействительный токен' });
    }
};

const hasRole = (roles) => (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Недостаточно прав' });
    }
};

const isAdmin = hasRole(['admin']);

module.exports = { auth, isAdmin, hasRole };
