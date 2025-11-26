const { Product } = require('../models/product');
const { Category } = require('../models/category');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
}

// Cloudinary Configuration
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

let storage;

// Switch between Cloudinary and Local Storage based on Env
if (process.env.CLOUDINARY_CLOUD_NAME) {
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'e-com-website',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        },
    });
} else {
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const isValid = FILE_TYPE_MAP[file.mimetype];
            let uploaderror = new Error('Invalid image type');
            if (isValid) {
                uploaderror = null;
            }
            cb(uploaderror, path.join(__dirname, '../public/uploads'));
        },
        filename: function (req, file, cb) {
            const extension = FILE_TYPE_MAP[file.mimetype];
            const fileName = file.originalname.split(' ').join('-');
            cb(null, `${Date.now()}-${fileName}.${extension}`);
        }
    });
}

const uploadOptions = multer({ storage: storage });


router.get('/', async (req, res) => {
  
    let filter = {};
    if (req.query.categories) {
      filter = { category: req.query.categories.split(',') };
    }
    
    // If adminOnly is requested and user is authenticated, filter by admin
    if (req.query.adminOnly === 'true' && req.auth?.userId) {
        filter.admin = req.auth.userId;
    }
  
    const productList = await Product.find(filter).populate('category', 'name');
    if (!productList) {
       return res.status(500).json({ message: 'No products found', success: false });
    }
    res.send(productList);
 
});

router.get('/:id', async (req, res) => {
   const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) {
       return res.status(500).json({ message: 'No products found', success: false });
    }
    res.send(product);
 
});

router.post('/', (req, res, next) => {
    const upload = uploadOptions.single('image');
    upload(req, res, function (err) {
        if (err) {
            console.error('Multer Upload Error:', err);
            return res.status(400).json({ message: 'Image upload failed: ' + err.message, success: false });
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log('Received product creation request');
        console.log('Body:', req.body);
        console.log('File:', req.file);
        
        if (!req.body.category) {
            return res.status(400).send({ message: 'Category is required', success: false });
        }

        if (!mongoose.isValidObjectId(req.body.category)) {
             return res.status(400).send({ message: 'Invalid Category ID format', success: false });
        }

        const category = await Category.findById(req.body.category);
        if (!category) {
            return res.status(400).send({ message: 'Invalid category', success: false });
        }
        
        const file = req.file;
        if (!file) {
            return res.status(400).send({ message: 'No image in the request', success: false });
        }

        let imagePath;
        if (file.path && (file.path.startsWith('http') || file.path.startsWith('https'))) {
             imagePath = file.path;
        } else {
             const fileName = req.file.filename;
             const basePath = `${req.protocol}://${req.get('host')}/uploads/`;
             imagePath = `${basePath}${fileName}`;
        }
        
        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagePath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating || 0,
            numReviews: req.body.numReview || 0,
            isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
            admin: req.auth?.userId // Assign product to the current admin
        });

        const savedProduct = await product.save();
        if (!savedProduct) {
            return res.status(500).send({ message: 'The product cannot be created', success: false });
        }
        res.status(201).send(savedProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).send({ message: error.message || 'Failed to create product', success: false });
    }
});

  router.put('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send({ message: 'Invalid product ID', success: false });
    }
    const category = await Category.findById(req.body.category);
    if (!category) {
        return res.status(400).send({ message: 'Invalid category', success: false });
    }
    const product = await product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: req.body.image,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReview: req.body.numReview,
            isFeatured: req.body.isFeatured
        }
        , { new: true, runValidators: true }
    );
    if (!product) {
        return res.status(404).send({ message: 'The product cannot be updated', success: false });
    }
    res.send(product);
  });

  router.delete('/:id', (req, res) => {
      product.findByIdAndRemove(req.params.id).then(product => {
      if (product) {
          return res.status(200).json({ message: 'product deleted successfully', success: true });
      } else {
          return res.status(404).json({ message: 'product not found', success: false });
      }
      })
      .catch(err => {
          return res.status(400).json({ error: err.message, success: false });
      })
    
    });

    router.get('/get/count', async (req, res) => {
        const productCount = await Product.countDocuments((count)=> count);
        if (!productCount) {
            return res.status(500).json({ message: 'No products found', success: false });
        }
        res.send({
            productCount: productCount,
            success: true
        });
    });

    router.get('/get/featured/:count', async (req, res) => {
        const count = req.params.count ? req.params.count : 0;
        const products = await Product.find({ isFeatured: true }).limit(+count);
        if (!products) {
            return res.status(500).json({ message: 'No products found', success: false });
        }
        res.send(products);
    });  

router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send({ message: 'Invalid product ID', success: false });
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    if (!files) {
        files.map(file => {
            imagesPaths.push(`${basePath}${file.filename}`);
        });
    }
    
       const product = await product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths
        }
        , { new: true, runValidators: true }
    );
    if (!product) {
        return res.status(404).send({ message: 'The product cannot be updated', success: false });
    }
    res.send(product);
});

module.exports = router;