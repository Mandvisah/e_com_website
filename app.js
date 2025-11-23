const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan'); 
const mongoose = require('mongoose');
const cors = require('cors');
const expressLayouts = require('express-ejs-layouts');
const authJwt = require('./helpers/jwt');
require('dotenv/config');
const errorHandler = require('./helpers/error-hendler');

const session = require('express-session');

// View engine setup
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(expressLayouts);
app.set('layout', 'layout');

// CORS for API calls
app.use(cors());

const api = process.env.API_URL || '/api/v1/';

// Middleware 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('tiny'));

// Express session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Static files middleware
app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static(__dirname + '/public/uploads')); // Serve static files from the uploads directory

//router
const categoriesRouter = require('./routers/categories');
const usersRouter = require('./routers/users');
const ordersRouter = require('./routers/orders');
const productsRouter = require('./routers/products');
const frontendRouter = require('./routers/frontend');

// Frontend Routes (serve EJS templates)
app.use('/', frontendRouter);

// API Routes - JWT handled individually in each router
app.use(api + 'categories', categoriesRouter);
app.use(api + 'users', usersRouter);
app.use(api + 'orders', ordersRouter);
app.use(api + 'products', productsRouter);

// Error handler middleware
app.use(errorHandler);

//database connection
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,  
  useUnifiedTopology: true
}).then(() => { 
  console.log('Database connection is ready...');
}).catch(err => {
  console.error('Database connection error:', err); 
});

app.listen(3000, () => {
    console.log('Server is running http://localhost:3000');
})