const router = require('express').Router();
const authController = require('../controllers/auth_controller');
const validationMiddleware = require('../middlewares/validation_middleware');

router.post('/login', authController.login);
router.get('/login', authController.showLoginForm);

router.post('/register', validationMiddleware.validateNewUser(), authController.register);
router.get('/register', authController.showRegisterForm);

router.post('/forgot-password', authController.forgotPassword);
router.get('/forgot-password', authController.showForgotPasswordForm);

module.exports = router;