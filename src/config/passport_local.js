const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user_model');

module.exports = function (passport) {
    const options = {
        usernameField: 'email',
        passwordField: 'password'
    };
    passport.use(new LocalStrategy(options, async (email, password, done) => {
        try {
            const _foundUser = await User.findOne({ email: email });
            if (!_foundUser) {
                return done(null, false, { message: 'user not found' })
            }
            if (_foundUser.password !== password) {
                return done(null, false, { message: 'password is wrong' });
            } else {    // kullanıcı bulundu
                return done(null, _foundUser);
            }
        } catch (err) {
            return done(err);
        }
    }));
    // user'ın id'sini browser'daki cookies alanında saklar (seesion'a kaydedilir)
    passport.serializeUser((user, done) => {
        console.log("session'a kaydedildi" + user.id);
        done(null, user.id);
    });

    // cookie'den okunan id değerinin users tablosunda tekrar bulunması ve user'ın return edilmesi
    passport.deserializeUser((id, done) => {
        // session'a kaydedilen id veritabanında arandı ve bulundu.
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });

}

