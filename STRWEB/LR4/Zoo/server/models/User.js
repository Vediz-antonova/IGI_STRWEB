const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Имя пользователя обязательно'],
        unique: true,
        trim: true,
        minlength: [3, 'Имя пользователя должно быть не менее 3 символов'],
        maxlength: [30, 'Имя пользователя должно быть не более 30 символов']
    },
    email: {
        type: String,
        required: [true, 'Email обязателен'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Пожалуйста, введите корректный email']
    },
    password: {
        type: String,
        required: [true, 'Пароль обязателен'],
        minlength: [6, 'Пароль должен быть не менее 6 символов']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    timezone: {
        type: String,
        default: 'Europe/Minsk'
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function() {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

userSchema.pre('findOneAndUpdate', async function(next) {
    if (this._update.password) {
        const salt = await bcrypt.genSalt(10);
        this._update.password = await bcrypt.hash(this._update.password, salt);
    }
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);