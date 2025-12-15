const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getCurrentTimezone } = require('../utils/timezone');

const register = async (req, res) => {
    try {
        const { username, email, password, timezone } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                error: 'Пользователь с таким email или именем уже существует'
            });
        }

        const user = new User({
            username,
            email,
            password,
            timezone: timezone || getCurrentTimezone()
        });

        await user.save();

        const token = user.generateAuthToken ? user.generateAuthToken() : jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                timezone: user.timezone
            },
            token
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const token = user.generateAuthToken ? user.generateAuthToken() : jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Вход выполнен успешно',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                timezone: user.timezone
            },
            token
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                timezone: user.timezone,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = { register, login, getProfile };