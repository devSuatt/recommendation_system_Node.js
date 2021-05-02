
const express = require('express');
const dotenv = require('dotenv').config();
const app = express();
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');

// db bağlantısı
require('./src/config/database');
const MongoDBStore = require('connect-mongodb-session')(session);
const sessionStore = new MongoDBStore(
    {
        uri: process.env.MONGODB_CONNECTION_STRING,
        collection: 'allSessions'
    });

// session ve flash messages
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60  // 1 saat sonra cookie silinecek 
    },
    store: sessionStore
}));

app.use(flash());
app.use((req, res, next) => {
    res.locals.validation_error = req.flash('validation_error');
    res.locals.success_message = req.flash('success_message');
    res.locals.firstName = req.flash('firstName');
    res.locals.lastName = req.flash('lastName');
    res.locals.email = req.flash('email');
    res.locals.password = req.flash('password');
    res.locals.repeatPassword = req.flash('repeatPassword');
    // db'de kaydedilen session'da flash alanında error dizisi var, 
    // oradan alıp response'un locals alanına login_error nesnesi ile koyalım:
    res.locals.login_errors = req.flash('error');
    next();
});

app.use(passport.initialize());
app.use(passport.session());

// import routers
const authRouter = require('./src/routes/auth_router');
const managementRouter = require('./src/routes/management_router');

// ejs template engine
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');

app.use(expressLayouts);
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/src/views'));

// formdan gelen bilgilerin okunabilmesi için middleware:
app.use(express.urlencoded({ extended: true }));

let counter = 0;
app.get('/', (req, res) => {
    if (req.session.counter) {  // counter varsa 1 arttır.
        req.session.counter++;
    } else {                    // yoksa oluştur, 1'den başlat.
        req.session.counter = 1;
    }
    res.send("<h1> BLOG SAYFASI </h1>"
    + "<h3> Burada ürünü tanıtan 3-4 sayfalık basit blog sayfası olacak </h3>"
    + "<h3> /login uzantısına gidip yönetim paneline eriş </h3>");
});

app.use('/', authRouter),
app.use('/management', managementRouter),

app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
});
