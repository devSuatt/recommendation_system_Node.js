const router = require('express').Router();
const managementController = require('../controllers/management_controller');
const authMiddleware = require('../middlewares/auth_middleware');

router.get('/', authMiddleware.notLoggedIn, managementController.showHomePage);
router.get('/import_file', authMiddleware.notLoggedIn, managementController.showImportPage);

module.exports = router;