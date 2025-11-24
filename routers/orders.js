const {Order} = require('../models/order');
const {OrderItem} = require('../models/order-item');
const {Product} = require('../models/product');
const express = require('express'); 
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authJwt = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.secret);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build filter object
        let filter = {};
        
        if (req.query.status) {
            filter.status = req.query.status;
        }
        
        if (req.query.search) {
            filter.$or = [
                { 'shippingAddress.email': { $regex: req.query.search, $options: 'i' } },
                { 'shippingAddress.firstName': { $regex: req.query.search, $options: 'i' } },
                { 'shippingAddress.lastName': { $regex: req.query.search, $options: 'i' } }
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
        
        // Check if user is authenticated and get their orders only (unless admin)
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.secret);
                if (!decoded.isAdmin) {
                    filter.user = decoded.userId;
                }
            } catch (error) {
                // Token invalid, continue without user filter
            }
        }
        
        const totalOrders = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .populate('user', 'name email')
            .populate({
                path: 'orderItems',
                populate: {
                    path: 'product',
                    populate: 'category'
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalPages = Math.ceil(totalOrders / limit);
        
        res.json({
            orders,
            currentPage: page,
            totalPages,
            totalOrders,
            success: true
        });
        
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders', success: false });
    }
});

router.get('/:id', async (req, res) => {
    const order = await Order.findById(req.params.id)
    .populate('user', 'name')
   .populate({
    path: 'orderItems',
    populate: {
        path: 'product',
        populate: {
            path: 'category'
        }
    }
});
    if (!order) {
        return res.status(404).send({ message: 'The order with the given ID was not found.', success: false });
    }
    res.send(order);
});

router.post('/', authJwt, async (req, res) => {
    try {
        console.log('=== Order Creation Request Received ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Request headers:', req.headers.authorization ? 'Token present' : 'No token');
        console.log('Authenticated user:', req.user);
        
        // Validate request body
        if (!req.body.orderItems || !Array.isArray(req.body.orderItems) || req.body.orderItems.length === 0) {
            console.log('Validation failed: orderItems missing or empty');
            return res.status(400).json({ 
                message: 'Order items are required and must be a non-empty array', 
                success: false 
            });
        }

        // Validate required fields
        const requiredFields = ['shippingAddress1', 'city', 'zip', 'country', 'phone'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                console.log(`Validation failed: ${field} is missing`);
                return res.status(400).json({ 
                    message: `${field} is required`, 
                    success: false 
                });
            }
        }
        
        // Use authenticated user ID instead of body.user
        const userId = req.user.userId;

        console.log('Validation passed, creating order items...');
        
        // Import Product model for stock validation
        const { Product } = require('../models/product');

        const orderItemsIds = Promise.all(
            req.body.orderItems.map(async orderItem => {
                if (!orderItem.quantity || !orderItem.product) {
                    throw new Error('Each order item must have quantity and product');
                }
                
                // Verify product exists and has sufficient stock
                const product = await Product.findById(orderItem.product);
                if (!product) {
                    throw new Error(`Product ${orderItem.product} not found`);
                }
                if (product.countInStock < orderItem.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.countInStock}, Requested: ${orderItem.quantity}`);
                }
                
                let newOrderItem = new OrderItem({
                    quantity: orderItem.quantity,
                    product: orderItem.product
                });
                newOrderItem = await newOrderItem.save();
                return newOrderItem._id;
            })
        );
    
    const orderItemsIdsResolved = await orderItemsIds;
    console.log('Order items created:', orderItemsIdsResolved);
    
    const totalPrices = await Promise.all(
        orderItemsIdsResolved.map(async orderItemId => {
            const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
            const totalPrice = orderItem.product.price * orderItem.quantity;
            return totalPrice;
        })
    );
    
    const finalTotalPrice = totalPrices.reduce((a, b) => a + b, 0);
    console.log('Total Price calculated:', finalTotalPrice);
  
    let order = new Order({
      orderItems: orderItemsIdsResolved,
      shippingAddress1: req.body.shippingAddress1,
      shippingAddress2: req.body.shippingAddress2 || '',
      city: req.body.city,
      zip: req.body.zip,
      country: req.body.country,
      phone: req.body.phone,
      status: req.body.status || 'Pending',
      totalPrice: finalTotalPrice,
      user: userId,
      paymentMethod: req.body.paymentMethod || 'cod',
    });

    console.log('Saving order:', order);
    order = await order.save();
    
    if (!order) {
        console.log('Order save failed');
        return res.status(500).send({ message: 'The order cannot be created', success: false });
    }
    
    console.log('Order created successfully:', order._id);
    res.send(order);

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ 
            message: error.message || 'Error creating order', 
            success: false 
        });
    }
});

// Removed duplicate routes - using authJwt protected versions below

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
    ]);
    if (!totalSales) {
        return res.status(400).send('The order sales cannot be generated');
    }
    res.send({ totalSales: totalSales.pop().totalSales });
});

router.get(`/get/count`, async (req, res) => {
    const orderCount = await Order.countDocuments((count) => count);
    if (!orderCount) {
        return res.status(500).json({ message: 'No orders found', success: false });
    }
    res.send({
        orderCount: orderCount,
        success: true
    });
});

router.get('/get/userorders/:userid', async (req, res) => {
    const userOrderlist = await Order.find({ user: req.params.userid })
    .populate({
      path: 'orderItems',
      populate: {
        path: 'product',
        populate: 'category'

}}).sort({dateOrdered: -1});
    if (!userOrderlist) {  
        return res.status(500).json({ message: 'No orders found for this user', success: false });
    } 
    res.send(userOrderlist);
});

// Get order statistics for admin
router.get('/stats', authJwt, async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: { $regex: /^pending$/i } });
        const processingOrders = await Order.countDocuments({ status: { $regex: /^processing$/i } });
        
        const revenueResult = await Order.aggregate([
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
        
        res.json({
            totalOrders,
            pendingOrders,
            processingOrders,
            totalRevenue,
            success: true
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order statistics', success: false });
    }
});

// Update order status
router.put('/:id', authJwt, async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                ...(notes && { notes })
            },
            { new: true }
        ).populate('user', 'name');
        
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found', success: false });
        }
        
        res.json({ message: 'Order updated successfully', order: updatedOrder, success: true });
    } catch (error) {
        res.status(400).json({ message: 'Error updating order', success: false });
    }
});

// Delete order
router.delete('/:id', authJwt, async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found', success: false });
        }
        
        // Also delete associated order items
        if (order.orderItems && order.orderItems.length > 0) {
            await OrderItem.deleteMany({ _id: { $in: order.orderItems } });
        }
        
        res.json({ message: 'Order deleted successfully', success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting order', success: false });
    }
});

module.exports = router;