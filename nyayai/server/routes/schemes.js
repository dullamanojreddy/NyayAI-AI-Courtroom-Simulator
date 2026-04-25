const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { match, getById } = require('../controllers/schemeController');

router.post('/match', auth, match);
router.get('/:id', auth, getById);

module.exports = router;
