const express = require('express');
const router = express.Router();
const { list, search, getBySectionId } = require('../controllers/lawController');

router.get('/', list);
router.get('/search', search);
router.get('/:sectionId', getBySectionId);

module.exports = router;
