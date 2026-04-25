const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  start,
  argue,
  verdict,
  generateQuestions,
  generateVerdict,
  simulateCourtroom
} = require('../controllers/courtroomController');

router.post('/start', auth, start);
router.post('/qa-grid', auth, generateQuestions);
router.post('/verdict-engine', auth, generateVerdict);
router.post('/simulate', auth, simulateCourtroom);
router.post('/argue', auth, argue);
router.post('/verdict', auth, verdict);

module.exports = router;
