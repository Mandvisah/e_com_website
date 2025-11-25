const {User}= require('../models/user');
const {Order} = require('../models/order');
const {OrderItem} = require('../models/order-item');
const {Product} = require('../models/product');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mandvigupta35@gmail.com',
        pass: 'cybkksanpnfhlggy'
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000
});

// Email sending utility for OTP
const sendVerificationEmail = async (email, otp, name) => {
    const mailOptions = {
    from: '"M-Vi Shopio" <mandvigupta35@gmail.com>',
    to: email,
    subject: 'Your Verification Code - M-Vi Shopio',
    text: `Hi ${name}, Your verification code is: ${otp}. This code will expire in 10 minutes.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1); }
          .header { background: linear-gradient(135deg, #0f172a, #1e293b); padding: 40px 30px; text-align: center; border-bottom: 3px solid #d4af37; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .content h2 { color: #0f172a; font-size: 24px; margin-bottom: 20px; }
          .content p { color: #475569; line-height: 1.6; margin-bottom: 20px; }
          .otp-box { background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 25px; text-align: center; border-radius: 15px; margin: 30px 0; border: 3px solid #d4af37; }
          .otp-code { font-size: 42px; font-weight: 700; letter-spacing: 8px; color: #d4af37; margin: 10px 0; }
          .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ Welcome to Our Store!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name}! 👋</h2>
            <p>Thank you for registering with us. We're excited to have you on board!</p>
            <p>To complete your registration and start shopping, please enter this verification code:</p>
            <div class="otp-box">
              <div style="font-size: 16px; color: #d4af37; margin-bottom: 10px;">YOUR VERIFICATION CODE</div>
              <div class="otp-code">${otp}</div>
              <div style="font-size: 14px; color: #94a3b8; margin-top: 10px;">Valid for 10 minutes</div>
            </div>
            <p><strong>Security Note:</strong> This code will expire in 10 minutes. Never share this code with anyone.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>If you didn't create an account with us, please ignore this email.</p>
            <p>© 2025 M-Vi Shopio. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, token, name) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: '"M-Vi Shopio" <mandvigupta35@gmail.com>',
    to: email,
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1); }
          .header { background: linear-gradient(135deg, #0f172a, #1e293b); padding: 40px 30px; text-align: center; border-bottom: 3px solid #d4af37; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .content h2 { color: #0f172a; font-size: 24px; margin-bottom: 20px; }
          .content p { color: #475569; line-height: 1.6; margin-bottom: 20px; }
          .button { display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; border: 2px solid #fca5a5; transition: all 0.3s ease; }
          .button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3); }
          .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${name}! 👋</h2>
            <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">🔑 Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #f1f5f9; padding: 15px; border-radius: 8px; word-break: break-all; font-size: 13px; color: #475569;">${resetUrl}</p>
            <p><strong>Note:</strong> This reset link will expire in 1 hour for security reasons.</p>
          </div>
          <div class="footer">
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p>© 2025 M-Vi Shopio. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

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
    
    // Check if email is verified
    if (!user.isVerified) {
        return res.status(403).send({ 
            message: 'Please verify your email before logging in. Check your inbox for the verification link.', 
            success: false,
            needsVerification: true,
            email: user.email
        });
    }
    
    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
            const token = jwt.sign(
                {
                    userId: user._id.toString(),
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

  // OTP verification route
  router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.status(400).send({ message: 'Email and OTP are required', success: false });
        }
        
        const user = await User.findOne({ email: email });
        
        if (!user) {
            return res.status(400).send({ message: 'User not found', success: false });
        }
        
        if (user.isVerified) {
            return res.status(200).send({ message: 'Email already verified!', success: true, alreadyVerified: true });
        }

        // Check if OTP is expired
        if (user.otpExpires && user.otpExpires < Date.now()) {
            return res.status(400).send({ message: 'OTP has expired. Please request a new one.', success: false, expired: true });
        }

        // Check if OTP matches
        if (user.verificationOTP !== otp) {
            return res.status(400).send({ message: 'Invalid OTP. Please check and try again.', success: false });
        }
        
        // Update user verification status
        user.isVerified = true;
        user.verificationOTP = null;
        user.otpExpires = null;
        await user.save();
        
        // Generate JWT token for auto-login
        const secretKey = process.env.secret;
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                isAdmin: user.isAdmin,
            },
            secretKey,
            { expiresIn: '1d' }
        );
        
        res.status(200).send({ 
            message: 'Email verified successfully!', 
            success: true,
            token: token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).send({ message: 'Error verifying OTP', success: false });
    }
  });

  // Resend OTP route
  router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).send({ message: 'Email is required', success: false });
        }
        
        const user = await User.findOne({ email: email });
        
        if (!user) {
            return res.status(404).send({ message: 'User not found', success: false });
        }
        
        if (user.isVerified) {
            return res.status(400).send({ message: 'Email is already verified', success: false });
        }
        
        // Generate new OTP
        const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationOTP = verificationOTP;
        user.otpExpires = Date.now() + 600000; // 10 minutes
        await user.save();
        
        // Send new OTP
        await sendVerificationEmail(user.email, verificationOTP, user.name);
        
        res.status(200).send({ 
            message: 'New verification code sent to your email', 
            success: true 
        });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).send({ 
            message: 'Error sending verification code', 
            success: false 
        });
    }
  });

  // Admin route to delete test users (helpful during development)
  router.delete('/cleanup-test-users', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).send({ message: 'Email is required', success: false });
        }
        
        const result = await User.deleteOne({ email: email });
        
        if (result.deletedCount > 0) {
            res.status(200).send({ 
                message: `User with email ${email} deleted successfully`, 
                success: true 
            });
        } else {
            res.status(404).send({ 
                message: 'User not found', 
                success: false 
            });
        }
    } catch (error) {
        res.status(500).send({ 
            message: 'Error deleting user: ' + error.message, 
            success: false 
        });
    }
  });

  // Forgot password - request reset
  router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).send({ message: 'Email is required', success: false });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            // Don't reveal if user exists for security
            return res.status(200).send({ 
                message: 'If an account exists with this email, a password reset link has been sent.', 
                success: true 
            });
        }
        
        // Generate password reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await user.save();
        
        // Send password reset email
        await sendPasswordResetEmail(user.email, resetToken, user.name);
        
        res.status(200).send({ 
            message: 'If an account exists with this email, a password reset link has been sent.', 
            success: true 
        });
    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).send({ 
            message: 'Error processing password reset request', 
            success: false 
        });
    }
  });

  // Reset password with token
  router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).send({ message: 'Token and new password are required', success: false });
        }
        
        const user = await User.findOne({ 
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).send({ message: 'Invalid or expired reset token', success: false });
        }
        
        // Update password
        user.passwordHash = bcrypt.hashSync(newPassword, 10);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();
        
        res.status(200).send({ 
            message: 'Password reset successfully! You can now login with your new password.', 
            success: true 
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).send({ 
            message: 'Error resetting password', 
            success: false 
        });
    }
  });

  // Add a specific register route that matches frontend call
  router.post('/register', async (req, res) => {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
        return res.status(400).send({ message: 'User with this email already exists', success: false });
    }

    // Generate 6-digit OTP
    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 600000; // 10 minutes

    // Important: do NOT allow self-registration as admin. Force isAdmin to false for public registration.
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
        isAdmin: false,
        verificationOTP: verificationOTP,
        otpExpires: otpExpires,
        isVerified: false // Require OTP verification
    });

    try {
        // Try to send verification email
        let emailSent = false;
        try {
            await sendVerificationEmail(user.email, verificationOTP, user.name);
            emailSent = true;
            console.log('✅ Verification OTP sent successfully to:', user.email);
        } catch (emailError) {
            console.error('❌ Failed to send verification email:', emailError.message);
            console.log('⚠️  Email failed, but OTP will be shown for manual verification');
            console.log('📝 OTP for testing:', verificationOTP);
        }
        
        // Save user to database (always require verification)
        user = await user.save();
        if (!user) {
            return res.status(400).send({ message: 'The user cannot be created', success: false });
        }
        
        // Remove password from response
        const { passwordHash, ...userResponse } = user.toObject();
        
        // Always require OTP verification (whether email sent or not)
        const message = emailSent 
            ? 'Registration successful! Please check your email for the verification code.' 
            : `Registration successful! Check the alert for your verification code.`;
        
        res.status(201).send({ 
            message: message,
            success: true,
            user: userResponse,
            requiresVerification: true,
            email: user.email,
            // Include OTP in response if email failed (for testing)
            ...((!emailSent) && { otpForTesting: verificationOTP })
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