const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: true, message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: true, message: 'Invalid or expired token' });
    }
    req.user = decoded; // Store the decoded user info in req.user
    next();
  });
};

module.exports = authMiddleware;
