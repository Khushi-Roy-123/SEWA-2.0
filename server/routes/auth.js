const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, dob, phone, address, bloodGroup, allergies, emergencyContact, profilePhoto } = req.body;

    // Check if user exists
    const emailExist = await User.findOne({ email });
    if (emailExist) return res.status(400).send('Email already exists');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      dob,
      phone, 
      address, 
      bloodGroup, 
      allergies, 
      emergencyContact,
      profilePhoto
    });

    const savedUser = await user.save();
    res.send({ user: user._id });
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message || "Registration Error");
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Email is not found');

    // Check password
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).send('Invalid password');

    // Create and assign token
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET || 'secretKey');
    res.header('auth-token', token).send({ 
        token, 
        user: { 
            id: user._id, 
            name: user.name, 
            email: user.email,
            dob: user.dob,
            phone: user.phone,
            address: user.address,
            bloodGroup: user.bloodGroup,
            allergies: user.allergies,
            emergencyContact: user.emergencyContact,
            profilePhoto: user.profilePhoto
        } 
    });
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message || "Login Error");
  }
});

const verify = require('./verifyToken');

// Update User Profile
router.put('/update', verify, async (req, res) => {
    try {
        const { name, email, dob, phone, address, bloodGroup, allergies, emergencyContact, profilePhoto } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { 
                name, 
                email, 
                dob, 
                phone, 
                address, 
                bloodGroup, 
                allergies, 
                emergencyContact,
                profilePhoto
            },
            { new: true } // Return the updated document
        );

        res.send({ 
            user: { 
                id: updatedUser._id, 
                name: updatedUser.name, 
                email: updatedUser.email,
                dob: updatedUser.dob,
                phone: updatedUser.phone,
                address: updatedUser.address,
                bloodGroup: updatedUser.bloodGroup,
                allergies: updatedUser.allergies,
                emergencyContact: updatedUser.emergencyContact,
                profilePhoto: updatedUser.profilePhoto
            } 
        });
    } catch (err) {
        res.status(400).send(err);
    }
});

// Get Public Profile (For QR Code)
router.get('/public/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send('User not found');

        // Return only public safe info
        res.send({
            name: user.name,
            dob: user.dob,
            bloodGroup: user.bloodGroup,
            allergies: user.allergies,
            emergencyContact: user.emergencyContact,
            profilePhoto: user.profilePhoto
            // Do NOT return email, phone, address, or password
        });
    } catch (err) {
        res.status(400).send("Invalid User ID");
    }
});

module.exports = router;
