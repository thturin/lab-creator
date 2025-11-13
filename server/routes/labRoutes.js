const express = require('express');
const router = express.Router();
const {loadLab, getLabs,upsertLab, deleteLab} = require('../controllers/labController');


//ROOT localhost:4000/api/lab
router.get('/get-labs', getLabs);
router.get('/load-lab',loadLab);
router.post('/upsert-lab',upsertLab);
router.delete('/delete-lab/:labId',deleteLab);


module.exports = router;