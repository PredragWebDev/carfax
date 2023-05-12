module.exports = {
  isAuthenticated: function(req, res, next) {
    const { user } = req.session;

    // If we are authenticated we continue
    if (user) {
      return next();
    } else {
      req.flash("error_msg", "Please log in first");
      res.redirect("/users/login");
    }
  },
  isAdmin: function(req, res, next) {
    const { user } = req.session;

    // If user exists & If user is admin we continue
    if (user && user.role === "ADMIN") {
      return next();
    } else {
      req.flash("error_msg", "You are not authorized to view that resource");
      res.redirect("/");
    }
  },
  forwardAuthenticated: function(req, res, next) {
    const { user } = req.session;

    // If we aren't authenticated we continue
    if (!user) {
      return next();
    } else {
      res.redirect("/");
    }
  }
};
