
const { body } = require('express-validator');

const validateNewUser = () => {
    return [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Please enter a valid email'),
        body('password')
            .trim()
            .isLength({ min: 6 })
            .withMessage('password must be at least 6 characters'),
        body('firstName')
            .trim()
            .isLength({ min: 2 })
            .withMessage('First name must be at least 2 characters'),
        body('lastName')
            .trim()
            .isLength({ min: 2 })
            .withMessage('Last name must be at least 2 characters'),
        body('repeatPassword')
            .trim()
            .custom((value, { req }) => {   // custom() ile kendi validation kurallarımızı yazabiliriz.
                if (value != req.body.password) {
                    throw new Error('Passwords do not match each other!');
                }
                return true;
            })
    ];
}

module.exports = {
    validateNewUser
}
