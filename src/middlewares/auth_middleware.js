
const loggedInUser = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error', ['Please Sign in!']);
        res.redirect('/login');
    }
};

module.exports = {
    loggedInUser
}