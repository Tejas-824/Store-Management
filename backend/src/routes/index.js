const router = require('express').Router();
router.use('/auth',   require('./auth.routes'));
router.use('/users',  require('./user.routes'));
router.use('/roles',  require('./role.routes'));
router.use('/stores', require('./store.routes'));
module.exports = router;