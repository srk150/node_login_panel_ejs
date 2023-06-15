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

module.exports = authMiddleware;
