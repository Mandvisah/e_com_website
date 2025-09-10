function errorHandler(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        // JWT authentication error
        return res.status(401).json({ message: 'The user is not authorized' });
    }

    if (err.name === 'ValidationError') {
        // Mongoose validation error
        return res.status(400).json({ message: err.message });
    }

    // Default error
    return res.status(500).json({ message: 'Internal server error' });
}

module.exports = errorHandler;