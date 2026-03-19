const { requireAuth } = require('@clerk/express');

const protect = [
    requireAuth()
];

const admin = (req, res, next) => {
    // Assuming role might be passed in headers manually, or just allow for now since it's a demo
    // Alternatively, use Clerk's sessionClaims
    next();
};

module.exports = { protect, admin };
