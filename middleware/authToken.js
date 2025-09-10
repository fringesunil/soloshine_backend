const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    // Attach decoded user to request
    req.user = user;
    next();
  });
};

const checkAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  const tokenVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
if (!tokenVerified) {
    return res.status(401).json({ success: false, message: "user not autherized" });
}
if(tokenVerified.role !=="admin"){
    return res.status(401).json({ success: false, message: "user not autherized" });
}
 // Attach decoded user to request for downstream handlers
 req.user = tokenVerified;
next();
  
};

module.exports={
    authenticateToken,
    checkAdmin
}