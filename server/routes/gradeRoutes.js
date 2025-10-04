const express = require('express');
const router = express.Router();
const { gradeQuestion,gradeQuestionDeepSeek,calculateScore } = require('../controllers/gradeController');


//ROOT localhost:4000/api/grade
router.post('', gradeQuestionDeepSeek);
router.post('/calculate-score',calculateScore);



module.exports = router;