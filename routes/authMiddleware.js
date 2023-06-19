const jwt = require("jsonwebtoken");

// authMiddleware.js
const authMiddleware = (protectedRoutes) => {
  return (req, res, next) => {
    if (protectedRoutes.includes(req.path)) {
      if (req.session && req.session.userId) {
        // The user is authenticated, so allow them to proceed
        next();
      } else {
        // The user is not authenticated, redirect them to the login page
        res.redirect("/users");
      }
    } else {
      // This route doesn't require authentication, so allow all requests
      next();
    }
  };
};

function authenticateToken(token) {
  if (token == null) return res.sendStatus(401);
  // jwt.verify(token, "secretKey", (err, user) => {
  //   if (err) return res.sendStatus(403);
  //   req.user = user;
  //   next();
  // });
}

function validateToken(token) {
  try {
    const decodedToken = jwt.verify(token, "secretKey");
    return {
      isValid: true,
      payload: decodedToken,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
    };
  }
}

module.exports = {
  authMiddleware,
  authenticateToken,
  validateToken,
};
