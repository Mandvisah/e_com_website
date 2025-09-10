const {User}= require('../models/user');
const {Order} = require('../models/order');
const {OrderItem} = require('../models/order-item');
const {Product} = require('../models/product');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Get current admin ID from JWT token
        const currentAdminId = req.auth?.userId;
        
        // Build filter object
        let filter = {};
        
        if (req.query.type) {
            filter.isAdmin = req.query.type === 'admin';
        }
        
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { firstName: { $regex: req.query.search, $options: 'i' } },
                { lastName: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
                { phone: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        if (req.query.dateFrom || req.query.dateTo) {
            filter.createdAt = {};
            if (req.query.dateFrom) {
                filter.createdAt.$gte = new Date(req.query.dateFrom);
            }
            if (req.query.dateTo) {
                filter.createdAt.$lte = new Date(req.query.dateTo);
            }
        }

        // If current user is an admin and adminProductsOnly is requested, 
        // filter users who have ordered products from this admin
        if (currentAdminId && req.query.adminProductsOnly === 'true') {
            // Find all products owned by this admin
            const adminProducts = await Product.find({ admin: currentAdminId }).select('_id');
            const adminProductIds = adminProducts.map(p => p._id);
            
            if (adminProductIds.length > 0) {
                // Find all order items that contain admin's products
                const orderItems = await OrderItem.find({ 
                    product: { $in: adminProductIds } 
                }).select('_id');
                const orderItemIds = orderItems.map(oi => oi._id);
                
                if (orderItemIds.length > 0) {
                    // Find all orders that contain these order items
                    const orders = await Order.find({ 
                        orderItems: { $in: orderItemIds } 
                    }).select('user');
                    const userIds = [...new Set(orders.map(o => o.user))]; // Remove duplicates
                    
                    // Add user filter to only show users who ordered from this admin
                    filter._id = { $in: userIds };
                } else {
                    // No orders for admin's products, return empty result
                    filter._id = { $in: [] };
                }
            } else {
                // No products for this admin, return empty result
                filter._id = { $in: [] };
            }
        }
        
        const totalUsers = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalPages = Math.ceil(totalUsers / limit);
        
        res.json({
            users,
            currentPage: page,
            totalPages,
            totalUsers,
            success: true
        });
        
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', success: false });
    }
});

// Get user profile - MUST come before /:id route
router.get('/profile', async (req, res) => {
    try {
        // req.auth is set by the express-jwt middleware
        const user = await User.findById(req.auth.userId).select('-passwordHash -__v');
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        res.json(user);
    } catch (error) {
        console.error('Profile route error:', error);
        res.status(500).json({ message: 'Error fetching profile', success: false });
    }
});

// Get user summary - MUST come before /:id route
router.get('/summary', async (req, res) => {
    try {
        const orders = await Order.find({ user: req.auth.userId });
        
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const activeOrders = orders.filter(order => ['pending', 'processing', 'shipped'].includes(order.status)).length;
        
        res.json({
            totalOrders,
            totalSpent,
            success: true
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching user summary', 
            success: false,
            totalOrders: 0,
            totalSpent: 0
        });
    }
});

// Get user count - MUST come before /:id route
router.get('/get/count', async (req, res) => {
    const userCount = await User.countDocuments();
    if (!userCount) {
        return res.status(500).json({ message: 'No user found', success: false });
    }
    res.send({
        userCount:userCount,
        success: true
    });
});

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash -__v');
        if (!user) {
            return res.status(404).send({ message: 'The user with the given ID was not found.', success: false });
        }
        res.send(user);
    } catch (error) {
        res.status(400).send({ message: 'Invalid user ID', success: false });
    }
})

router.post('/', async (req, res) => {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).send({ message: 'User with this email already exists', success: false });
        }

        let user = new User({
            name: req.body.name,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            passwordHash: bcrypt.hashSync(req.body.password, 10),
            street: req.body.street,
            apartment: req.body.apartment,
            city: req.body.city,
            zip: req.body.zip,
            country: req.body.country,
            phone: req.body.phone,
            dateOfBirth: req.body.dateOfBirth,
            isAdmin: req.body.isAdmin || false,
        });
        
        user = await user.save();
        if (!user) {
            return res.status(400).send({ message: 'The user cannot be created', success: false });
        }
        
        // Remove password from response
        const { passwordHash, ...userResponse } = user.toObject();
        res.status(201).send({ 
            message: 'User created successfully', 
            success: true,
            user: userResponse 
        });
    } catch (error) {
        res.status(400).send({ 
            message: error.message || 'User creation failed', 
            success: false 
        });
    }
});

// Update user (admin functionality)
router.put('/:id', async (req, res) => {
    try {
        const { firstName, lastName, name, email, phone, dateOfBirth, street, apartment, city, zip, country, isAdmin } = req.body;
        
        // Check if email is already taken by another user
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already exists', success: false });
            }
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                firstName,
                lastName,
                name,
                email,
                phone,
                dateOfBirth,
                street,
                apartment,
                city,
                zip,
                country,
                isAdmin
            },
            { new: true, runValidators: true }
        ).select('-passwordHash');
        
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        
        res.json({ message: 'User updated successfully', user: updatedUser, success: true });
    } catch (error) {
        res.status(400).json({ message: error.message || 'Error updating user', success: false });
    }
});

  router.post('/login', async (req, res) => {

    const user = await User.findOne({ email: req.body.email });
    const secretKey = process.env.secret;
    if (!user) {
        return res.status(404).send({ message: 'The user with the given email was not found.', success: false });
    }
    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
            const token = jwt.sign(
                {
                    userId: user.id,
                    isAdmin: user.isAdmin,
                },
                secretKey, // Replace with your actual secret key
                 {expiresIn: '1d'}, // Token expiration time
            );
            res.status(200).send({ 
                user: {
                    _id: user._id,
                    email: user.email,
                    name: user.name,
                    isAdmin: user.isAdmin
                }, 
                token: token 
            });
        } else {
            return res.status(400).send({ message: 'Password is incorrect', success: false });
        }
  });

  // Add a specific register route that matches frontend call
  router.post('/register', async (req, res) => {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
        return res.status(400).send({ message: 'User with this email already exists', success: false });
    }

    let user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      street: req.body.street,
      apartment: req.body.apartment,
      city: req.body.city,
      zip: req.body.zip,
      country: req.body.country,
      phone: req.body.phone,
      isAdmin: req.body.isAdmin === true || req.body.isAdmin === 'true', // Handle admin registration
    });

    try {
        user = await user.save();
        if (!user) {
            return res.status(400).send({ message: 'The user cannot be created', success: false });
        }
        
        // Remove password from response
        const { passwordHash, ...userResponse } = user.toObject();
        res.status(201).send({ 
            message: 'User registered successfully', 
            success: true,
            user: userResponse 
        });
    } catch (error) {
        res.status(400).send({ 
            message: error.message || 'Registration failed', 
            success: false 
        });
    }
  });

  router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id).then(user => {
      if (user) {
        return res.status(200).json({ message: 'User deleted successfully', success: true });
      } else {
        return res.status(404).json({ message: 'User not found', success: false });
      }
    })
    .catch(err => {
      return res.status(400).json({ error: err.message, success: false });
    });
  });

// Update user profile
router.put('/profile', async (req, res) => {
    try {
        const { firstName, lastName, phone, dateOfBirth, street, apartment, city, zip, country } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.auth.userId,
            {
                firstName,
                lastName,
                phone,
                dateOfBirth,
                street,
                apartment,
                city,
                zip,
                country
            },
            { new: true, runValidators: true }
        ).select('-passwordHash -__v');
        
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        
        res.json({ message: 'Profile updated successfully', user: updatedUser, success: true });
    } catch (error) {
        res.status(400).json({ message: error.message || 'Error updating profile', success: false });
    }
});

// Change password
router.put('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const user = await User.findById(req.auth.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        
        // Verify current password
        const isValidPassword = bcrypt.compareSync(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Current password is incorrect', success: false });
        }
        
        // Hash new password
        const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
        
        await User.findByIdAndUpdate(req.auth.userId, {
            passwordHash: hashedNewPassword
        });
        
        res.json({ message: 'Password changed successfully', success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error changing password', success: false });
    }
});

// Delete user account
router.delete('/profile', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.auth.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        
        // Also delete user's orders (optional, depending on business logic)
        await Order.deleteMany({ user: req.auth.userId });
        
        res.json({ message: 'Account deleted successfully', success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting account', success: false });
    }
});

module.exports = router;