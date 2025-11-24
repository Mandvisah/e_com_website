const express = require('express');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
    res.render('index', { title: 'Home - E-Commerce Store' });
});

// Products page
router.get('/products', (req, res) => {
    res.render('products', { title: 'Products - E-Commerce Store' });
});

// Product detail page
router.get('/product/:id', (req, res) => {
    res.render('product-detail', { 
        title: 'Product Details - E-Commerce Store',
        productId: req.params.id 
    });
});

// Cart page
router.get('/cart', (req, res) => {
    res.render('cart', { title: 'Shopping Cart - E-Commerce Store' });
});

// Categories page
router.get('/categories', (req, res) => {
    res.render('categories', { title: 'Categories - E-Commerce Store' });
});

// Category products page
router.get('/category/:id', (req, res) => {
    res.render('category-products', { 
        title: 'Category Products - E-Commerce Store',
        categoryId: req.params.id 
    });
});

// Login page
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login - E-Commerce Store', layout: false });
});

// Register page
router.get('/register', (req, res) => {
    res.render('register', { title: 'Register - E-Commerce Store', layout: false });
});

// Email verification (OTP) page
router.get('/verify-email', (req, res) => {
    res.render('verify-email', { 
        title: 'Verify Email - E-Commerce Store', 
        layout: false,
        email: req.query.email 
    });
});

// Forgot password page
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { title: 'Forgot Password - E-Commerce Store', layout: false });
});

// Reset password page
router.get('/reset-password', (req, res) => {
    res.render('reset-password', { 
        title: 'Reset Password - E-Commerce Store', 
        layout: false,
        token: req.query.token 
    });
});

// Cleanup test users page (for development)
router.get('/cleanup-users', (req, res) => {
    res.render('cleanup-users', { 
        title: 'Cleanup Test Users - E-Commerce Store', 
        layout: false
    });
});

// Checkout page
router.get('/checkout', (req, res) => {
    res.render('checkout', { title: 'Checkout - E-Commerce Store' });
});

// Orders page
router.get('/orders', (req, res) => {
    res.render('orders', { title: 'My Orders - E-Commerce Store' });
});

// Order detail page
router.get('/order/:id', (req, res) => {
    res.render('order-detail', { 
        title: 'Order Details - E-Commerce Store',
        orderId: req.params.id 
    });
});

// Profile page
router.get('/profile', (req, res) => {
    res.render('profile', { title: 'My Profile - E-Commerce Store' });
});

// Edit Profile page
router.get('/edit-profile', (req, res) => {
    res.render('edit-profile', { title: 'Edit Profile - E-Commerce Store' });
});

// Search results page
router.get('/search', (req, res) => {
    res.render('search', { 
        title: 'Search Results - E-Commerce Store',
        query: req.query.q || ''
    });
});

// Admin routes
router.get('/admin', (req, res) => {
    res.render('admin-dashboard', { title: 'Admin Dashboard - E-Commerce Store' });
});

router.get('/admin/add-product', (req, res) => {
    res.render('add-product', { title: 'Add Product - Admin - E-Commerce Store' });
});

router.get('/admin/add-category', (req, res) => {
    res.render('add-category', { title: 'Add Category - Admin - E-Commerce Store' });
});

router.get('/admin/products', (req, res) => {
    res.render('admin-products', { title: 'Manage Products - Admin - E-Commerce Store' });
});

router.get('/admin/edit-product', (req, res) => {
    res.render('edit-product', { title: 'Edit Product - Admin - E-Commerce Store' });
});

router.get('/admin/categories', (req, res) => {
    res.render('admin-categories', { title: 'Manage Categories - Admin - E-Commerce Store' });
});

router.get('/admin/orders', (req, res) => {
    res.render('admin-orders', { title: 'Manage Orders - Admin - E-Commerce Store' });
});

router.get('/admin/users', (req, res) => {
    res.render('admin-users', { title: 'Manage Users - Admin - E-Commerce Store' });
});

module.exports = router;
