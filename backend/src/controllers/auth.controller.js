const httpStatus = require('http-status').status;
const catchAsync = require('../utils/catchAsync');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const generateToken = (userId) => {
    const secret = config.jwt.secret;
    return jwt.sign({ sub: userId }, secret, { expiresIn: '1d' });
};

const register = catchAsync(async (req, res) => {
    const { name, email, password } = req.body;

    if (await User.isEmailTaken(email)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(httpStatus.CREATED).send({ user, token });
});

const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.isPasswordMatch(password))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }

    const token = generateToken(user._id);
    res.send({ user, token });
});

module.exports = {
    register,
    login,
};
