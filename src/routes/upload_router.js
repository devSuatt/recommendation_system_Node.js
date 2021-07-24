const router = require('express').Router();
const uploadController = require('../controllers/upload_controller');
const authMiddleware = require('../middlewares/auth_middleware');

router.get('/', authMiddleware.notLoggedIn, uploadController.getUploadFile);
router.get('/datasetGroup', authMiddleware.notLoggedIn, uploadController.getDSGroup);
router.get('/usersFile', uploadController.getUsersUploadFile);
router.get('/itemsFile', authMiddleware.notLoggedIn, uploadController.getItemsUploadFile);
router.get('/interactionsFile', authMiddleware.notLoggedIn, uploadController.getInteractionsUploadFile);
router.get('/solution', authMiddleware.notLoggedIn, uploadController.getSolution);
router.get('/campaign', authMiddleware.notLoggedIn, uploadController.getCampaign);
router.get('/getResults', authMiddleware.notLoggedIn, uploadController.getResults);

router.post('/ds_group', authMiddleware.notLoggedIn, uploadController.createDSGroup);
router.post('/users', authMiddleware.notLoggedIn, uploadController.usersUploadFile);
router.post('/items', authMiddleware.notLoggedIn, uploadController.itemsUploadFile);
router.post('/interactions', authMiddleware.notLoggedIn, uploadController.interactionsUploadFile);
router.post('/createSolution', authMiddleware.notLoggedIn, uploadController.createSolution);
router.post('/createCampaign', authMiddleware.notLoggedIn, uploadController.createCampaign);

// router.post('/getRecommendation', authMiddleware.notLoggedIn, uploadController.getRecomendations);
router.post('/getRecommendations', authMiddleware.notLoggedIn, uploadController.getRecommendations);


module.exports = router;