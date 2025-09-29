const express = require('express');
const router = express.Router();
const { gradeQuestion } = require('../controllers/gradeController');
const {loadSession, saveSession} = require('../controllers/sessionController');

//ROOT localhost:4000/api/session
router.post('/save-session', );
router.get('/load-session/:title',);



module.exports = router;