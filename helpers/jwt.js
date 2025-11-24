const { expressjwt } = require('express-jwt');

function authJwt() {
    const secret = process.env.secret;
    const api = process.env.API_URL || '/api/v1';
    
    return expressjwt({
        secret,
        algorithms: ['HS256']
    }).unless({
        path: [
            // Public routes that don't need authentication
            {url: /\/public\/uploads(.*)/, methods: ['GET','OPTIONS']},
            {url: /\/api\/v1\/products(.*)/, methods: ['GET','OPTIONS']},
            {url: /\/api\/v1\/categories(.*)/, methods: ['GET','OPTIONS']},
            {url: /\/api\/v1\/users\/login/, methods: ['POST']},
            {url: /\/api\/v1\/users\/register/, methods: ['POST']},
            {url: /\/api\/v1\/users\/verify-otp/, methods: ['POST']}, // OTP verification
            {url: /\/api\/v1\/users\/resend-otp/, methods: ['POST']}, // Resend OTP
            {url: /\/api\/v1\/users\/forgot-password/, methods: ['POST']}, // Password reset request
            {url: /\/api\/v1\/users\/reset-password/, methods: ['POST']}, // Password reset confirm
            {url: /\/api\/v1\/users\/cleanup-test-users/, methods: ['DELETE']}, // Cleanup for testing
            {url: /\/api\/v1\/users$/, methods: ['POST']}, // For registration endpoint
            // Frontend routes (non-API)
            {url: /^(?!\/api).*/, methods: ['GET','OPTIONS']},
        ]
    });
}


module.exports = authJwt;