
const { validationResult } = require('express-validator');
const User = require('../models/user_model');
const passport = require('passport');
require('../config/passport_local')(passport); // bu passport nesnesi passport_local'den gönderildi.

const login = (req, res, next) => {
    const errors = validationResult(req);
    req.flash('email', req.body.email);
    req.flash('password', req.body.password);
    if (!errors.isEmpty()) {
        req.flash('validation_error', errors.array());
    } else {
        passport.authenticate('local', {
            successRedirect: '/management',   // başarılı olursa yönlendir
            failureRedirect: '/login',  // hatalı olursa buraya yönlendir
            failureFlash: true          // mesajları aç
        })(req, res, next);
    }

};

const showLoginForm = (req, res) => {
    res.render('login', { layout: './layout/auth_layout.ejs' });
};

const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {    // validation error(s) varsa
        req.flash('validation_error', errors.array());
        req.flash('firstName', req.body.firstName);
        req.flash('lastName', req.body.lastName);
        req.flash('email', req.body.email);
        req.flash('password', req.body.email);
        req.flash('repeatPassword', req.body.email);
        res.redirect('/register');
    } else {    // validation error(s) yoksa
        try {
            const _user = await User.findOne({ email: req.body.email });
            if (_user) { // eğer böyle bir user bulunduysa
                req.flash('validation_error', [{ msg: "Someone else is already using this email!" }]);
                req.flash('firstName', req.body.firstName);
                req.flash('lastName', req.body.lastName);
                req.flash('email', req.body.email);
                req.flash('password', req.body.email);
                req.flash('repeatPassword', req.body.email);
                res.redirect('/register');
            } else {    // veritabanında bu maili kullanan bir user yoksa
                const newUser = new User({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: req.body.password
                });
                await newUser.save();   // yeni kullanıcıyı db'ye kaydet
                console.log("user kaydedildi");
                req.flash('success_message', [{ msg: 'user has been saved successfully' }]);
                res.redirect('/login');
            }
        } catch (error) {
            console.log(error);
        }
    }
};

const showRegisterForm = (req, res) => {
    res.render('register', { layout: './layout/auth_layout.ejs' });
};

const showForgotPasswordForm = (req, res) => {
    res.render('forgot_password', { layout: './layout/auth_layout.ejs' });
};

const forgotPassword = (req, res, next) => {
    res.render('forgot_password', { layout: './layout/auth_layout.ejs' });
};

const logout = (req, res, next) => {
    req.logout();   // db'deki session kısmındaki passport alanındaki id silinir.
    req.session.destroy((error) => {    // session'ı da silmeliyiz
        res.clearCookie('connect.sid'); // mevcut cookie'yi temizle
        res.redirect('/login');
    });
};

module.exports = {
    login,
    showLoginForm,
    register,
    showRegisterForm,
    forgotPassword,
    showForgotPasswordForm,
    logout
}