# Inventory Management System

A modern, full-stack Inventory Management System (IMS) built with Node.js, Express.js, MongoDB, and EJS templating. The application supports product/catalog management, user authentication with OTP verification, inventory tracking, a shopping-style cart for order creation, and an admin panel for managing products, categories, users, and orders.

## Features

### User Features

- **User Registration & Login:** Secure authentication using JWT and sessions.
- **Email Verification:** OTP-based email verification during registration.
- **Profile Management:** Edit user profile and view order history.
- **Product Catalog:** Browse products by category, search, and filter.
- **Product Details:** View detailed product information and images.
- **Shopping Cart:** Add, update, and remove items (only for logged-in users).
- **Checkout:** Place orders with address and payment method.
- **Order Tracking:** View order status and details.

### Admin Features

- **Admin Dashboard:** Overview of sales, users, and orders.
- **Product Management:** Add, edit, delete products; upload images.
- **Category Management:** Create and manage product categories.
- **Order Management:** View, update, and process orders.
- **User Management:** View and manage registered users.

### UI/UX

- **Modern Design:** 3D effects, glassmorphism, gradients.
- **Responsive Layout:** Works on desktop, tablet, and mobile.
- **Toast Notifications:** User feedback for actions.
- **Loading Spinners:** Smooth transitions and feedback.

### Frontend Features

- **Dynamic Product Filtering & Search:** Instantly filter products by category, price, and search keywords.
- **Animated Product Cards:** Interactive hover effects and 3D transitions for product displays.
- **Cart Sidebar/Modal:** Quick access to cart contents from any page.
- **Order Summary & Validation:** Real-time order summary and form validation during checkout.
- **User-Friendly Navigation:** Sticky navigation bar, dropdown menus, and smooth page transitions.
- **Error Handling:** Friendly error messages and fallback UI for missing data.
- **Accessibility:** Keyboard navigation and ARIA roles for better usability.

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Frontend:** EJS templates, CSS, JavaScript
- **Authentication:** JWT, express-session
- **Email Service:** Nodemailer (Gmail SMTP)
- **File Uploads:** Multer
- **Logging:** Morgan

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Mandvisah/e_com_website.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file in the root directory:
   ```env
   MONGO_URL=<your-mongodb-connection-string>
   SESSION_SECRET=<your-session-secret>
   API_URL=/api/v1/
   secret=<your-jwt-secret>
   FRONTEND_URL=http://localhost:3000
   ```
   *Note: Email configuration is currently handled in `routers/users.js` using Gmail SMTP.*

4. Start the server:
   ```bash
   npm start
   ```

### Usage

- Visit `http://localhost:3000` in your browser.
- Register a new account (requires email verification via OTP).
- Log in to start shopping.
- Admin users can access the admin panel for management tasks.

## Folder Structure

- `app.js` - Main Express server entry point
- `models/` - Mongoose schemas (User, Product, Order, Category, OrderItem)
- `routers/` - Express route handlers (API and Frontend routes)
- `views/` - EJS templates for frontend pages
- `public/` - Static assets (CSS, JS, images, uploads)
- `helpers/` - Utility functions (JWT, Error Handling)
- `.env` - Environment variables configuration

## Security & Best Practices

- **Password Hashing:** Bcryptjs for secure password storage.
- **Authentication:** JWT tokens for API access and Sessions for frontend state.
- **Input Validation:** Server-side validation for critical actions.
- **Secure Connections:** SMTP configuration for email delivery.

## License

This project is for educational/demo purposes.
