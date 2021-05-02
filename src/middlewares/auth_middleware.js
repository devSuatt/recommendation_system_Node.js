
const notLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error', ['Please Sign in!']);
        res.redirect('/login');
    }
};

const loggedInUser = (req, res, next) => {   
    if (!req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/management');    // eğer oturum açılmışsa login veya register sayfalarına
    }                                   // gidilmek istendiğinde kullanıcı management sayfasına yönlensin
};

module.exports = {
    notLoggedIn,
    loggedInUser
}