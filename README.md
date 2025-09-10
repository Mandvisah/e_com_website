# E-Commerce Website

A modern, full-stack e-commerce web application built with Node.js, Express.js, MongoDB, and EJS templating. This project demonstrates best practices in authentication, cart management, order processing, and admin control, with a stylish and responsive frontend.

## Features

### User Features

- **User Registration & Login:** Secure authentication using JWT and sessions
- **Profile Management:** Edit user profile and view order history
- **Product Catalog:** Browse products by category, search, and filter
- **Product Details:** View detailed product information and images
- **Shopping Cart:** Add, update, and remove items (only for logged-in users)
- **Checkout:** Place orders with address and payment method
- **Order Tracking:** View order status and details

### Admin Features

- **Admin Dashboard:** Overview of sales, users, and orders
- **Product Management:** Add, edit, delete products; upload images
- **Category Management:** Create and manage product categories
- **Order Management:** View, update, and process orders
- **User Management:** View and manage registered users

### UI/UX

- **Modern Design:** 3D effects, glassmorphism, gradients
- **Responsive Layout:** Works on desktop, tablet, and mobile
- **Toast Notifications:** User feedback for actions
- **Loading Spinners:** Smooth transitions and feedback

### Frontend Features

- **Dynamic Product Filtering & Search:** Instantly filter products by category, price, and search keywords
- **Animated Product Cards:** Interactive hover effects and 3D transitions for product displays
- **Cart Sidebar/Modal:** Quick access to cart contents from any page
- **Order Summary & Validation:** Real-time order summary and form validation during checkout
- **User-Friendly Navigation:** Sticky navigation bar, dropdown menus, and smooth page transitions
- **Error Handling:** Friendly error messages and fallback UI for missing data
- **Accessibility:** Keyboard navigation and ARIA roles for better usability

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Frontend:** EJS templates, CSS, JavaScript
- **Authentication:** JWT, express-session
- **File Uploads:** Multer
- **Logging:** Morgan

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB

### Installation

1. Clone the repository:
   ```
   git clone <your-repo-url>
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your `.env` file:
   ```
   MONGO_URL=<your-mongodb-connection-string>
   SESSION_SECRET=<your-session-secret>
   API_URL=/api/v1/
   secret=<your-jwt-secret>
   ```
4. Start the server:
   ```
   npm start
   ```

### Usage

- Visit `http://localhost:3000` in your browser.
- Register or log in to start shopping.
- Admin users can access the admin panel for management tasks.

## Folder Structure

- `app.js` - Main Express server
- `models/` - Mongoose models (User, Product, Order, etc.)
- `routers/` - Express route handlers
- `views/` - EJS templates for frontend pages
- `public/` - Static assets (CSS, JS, images)
- `.env` - Environment variables

## Security & Best Practices

- Passwords are hashed before storage
- JWT tokens for secure API access
- Session management for user authentication
- Input validation and error handling

## License

This project is for educational/demo purposes.
