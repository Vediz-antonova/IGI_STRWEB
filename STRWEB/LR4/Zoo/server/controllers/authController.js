const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getCurrentTimezone } = require('../utils/timezone');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendResponse = (res, success, message, data = null, status = 200) => {
    res.status(status).json({ success, message, data });
};

const register = async (req, res) => {
    try {
        const { username, email, password, timezone } = req.body;

        if (!username || !email || !password) {
            return sendResponse(res, false, 'Все поля обязательны', null, 400);
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return sendResponse(res, false, 'Пользователь с таким email или именем уже существует', null, 400);
        }

        const user = new User({
            username,
            email,
            password,
            timezone: timezone || getCurrentTimezone()
        });

        await user.save();

        const token = user.generateAuthToken();

        sendResponse(res, true, 'Пользователь успешно зарегистрирован', {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                timezone: user.timezone
            },
            token
        }, 201);
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendResponse(res, false, 'Email и пароль обязательны', null, 400);
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return sendResponse(res, false, 'Неверный email или пароль', null, 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return sendResponse(res, false, 'Неверный email или пароль', null, 401);
        }

        user.lastLogin = new Date();
        await user.save();

        const token = user.generateAuthToken();

        sendResponse(res, true, 'Вход выполнен успешно', {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                timezone: user.timezone,
                lastLogin: user.lastLogin
            },
            token
        });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return sendResponse(res, false, 'Пользователь не найден', null, 404);
        }

        sendResponse(res, true, 'Профиль получен успешно', {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            timezone: user.timezone,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                username: name,
                email,
                password: 'google-oauth',
                role: 'user',
                timezone: getCurrentTimezone()
            });
            await user.save();
        }

        user.lastLogin = new Date();
        await user.save();

        const jwtToken = user.generateAuthToken();

        sendResponse(res, true, 'Вход через Google выполнен успешно', {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                timezone: user.timezone,
                lastLogin: user.lastLogin
            },
            token: jwtToken
        });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

module.exports = { register, login, getProfile, googleLogin };