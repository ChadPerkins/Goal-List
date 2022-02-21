const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Validate the user submited all forms
    if(!name || !email || !password) {
        res.status(400);
        throw new Error('Please fill out all fields');
    }

    // Check to see if the user already exists
    const userExists = await User.findOne({email});
    if(userExists) {
        res.status(400);
        throw new Error('User already exists');
    }
    
    // Hash the users password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create the new user
    const user = await User.create({
        name,
        email,
        password: hashedPassword
    });
    if(user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for the user's email
    const user = await User.findOne({email});
    
    // Validate the users email and password
    if(user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        })
    } else {
        res.status(400);
        throw new Error('Invalid credentials');
    }
});

const getMe = asyncHandler(async (req, res) => {
    const { _id, name, email } = await User.findById(req.user.id);

    res.status(200).json({
        id: _id,
        name,
        email
    });
});

// Generate JWT
const generateToken = (id) => {
    return jwt.sign(
                        { id },
                        process.env.JWT_SECRET,
                        { expiresIn: '30d'}
                    );
}

module.exports = {
    getMe,
    loginUser,
    registerUser
};