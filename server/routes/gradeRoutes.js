const express = require('express');
const router = express.Router();
const { gradeQuestion,gradeQuestionDeepSeek } = require('../controllers/gradeController');


//ROOT localhost:4000/api/grade
router.post('', gradeQuestionDeepSeek);



module.exports = router;