const express = require('express');
const router = express.Router();
const { classify } = require('../controllers/classifyController');

router.post('/', classify);

module.exports = router;
