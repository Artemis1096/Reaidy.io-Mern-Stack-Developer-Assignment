const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new Error('Invalid email');
                }
            },
        },
        password: {
            type: String,
            required: true,
            trim: true,
            minlength: 8,
            private: true, // used by toJSON plugin if we had one, or manual transformation
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        preferences: {
            categories: [{
                type: String,
                trim: true
            }],
            notifications: {
                type: Boolean,
                default: true
            }
        }
    },
    {
        timestamps: true,
    }
);

// Check if email is taken
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
    const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
    return !!user;
};

// Hash password before saving
userSchema.pre('save', async function () {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
});

// Method to check password
userSchema.methods.isPasswordMatch = async function (password) {
    const user = this;
    return bcrypt.compare(password, user.password);
};

// Create indexes
// Email index is automatically created by unique: true
userSchema.index({ 'preferences.categories': 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
