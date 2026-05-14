import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
    // Expect the token in the Auth header: "Bearer <token>"
    const authHeader = req.headers.authorization;

    // If there is no token, throw a 401
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // 401 Unauthorized
        return res.status(401).json({ error: 'Authentication token required.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        // Attach the user ID to the request object so our CRUD routes can use it
        req.user = { id: decodedToken.userId }; 
        next(); // Move on to the actual CRUD route
    } catch (error) {
        // 403 Forbidden 
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
};
