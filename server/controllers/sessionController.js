const axios = require('axios');
require('dotenv').config();


const saveSession = async(req,res)=>{
    const {labInfo,responses,gradedResults,finalScore} = req.body;
    const {title, username, studentId} = labInfo;
    if(!title || !studentId) return res.status(400).json({error:'Missing assignment title or Student Id'});
    try{
        //upsert updates if session exists, or create if it does not
        const sessoin = await prisma.session.upsert({
            where: {labTitle_studentId: {title,studentId}},
            update: {responses,gradedResults,finalScore},
            create: {labTitle:title, username, studentId, responses,gradedResults,finalScore}
        });
        res.json({message: 'Session Saved',session});
    }catch(err){
        console.error('Error in saveSession()->',err);
        res.json({error:'Could not save session'});
    }
};

const loadSession = async(req,res)=>{
    const {title, studentId} = req.params;
    if(!title || !studentId) return res.status(400).json({error: 'Missing lab title or Student Id'});
    try{
        const session = await prisma.session.findUnique({
            where:{labTitle_studentId: {title,studentId}}
        });
        if(!session){
            return res.status(404).json({error: 'Session not found'});
        }
        res.json(session);
    }catch(err){
        console.error('Error in getSession()->',err);
        res.json(500).json({error:'Count not get session'});
    }


}

module.exports = { saveSession, loadSession };