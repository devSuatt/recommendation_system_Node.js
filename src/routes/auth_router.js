const router = require('express').Router();
const authController = require('../controllers/auth_controller');
const validationMiddleware = require('../middlewares/validation_middleware');
const authMiddleware = require('../middlewares/auth_middleware');

router.post('/login', authMiddleware.loggedInUser, authController.login);
router.get('/login', authMiddleware.loggedInUser, authController.showLoginForm);

router.post('/register', authMiddleware.loggedInUser, validationMiddleware.validateNewUser(), authController.register);
router.get('/register', authMiddleware.loggedInUser, authController.showRegisterForm);

router.post('/forgot-password', authMiddleware.loggedInUser, authController.forgotPassword);
router.get('/forgot-password', authMiddleware.loggedInUser, authController.showForgotPasswordForm);

router.get('/logout', authMiddleware.notLoggedIn, authController.logout);

module.exports = router;