const express = require('express');
const router = express.Router();
const { gradeQuestion } = require('../controllers/gradeController');


//ROOT localhost:4001/api/grade
router.post('', gradeQuestion);
router.get('/health',(req,res)=>res.send("grade router is working!"));


module.exports = router;