const axios = require('axios');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const saveSession = async(req,res)=>{
    const {labInfo,responses,gradedResults,finalScore} = req.body;
    const {title, username, studentId} = labInfo;
    if(!title || !studentId) return res.status(400).json({error:'Missing assignment title or Student Id'});
    try{
        //upsert updates if session exists, or create if it does not
        const session = await prisma.session.upsert({
            where: {labTitle_studentId: {labTitle:title,studentId}},
            update: {responses,gradedResults,finalScore},
            create: {labTitle:title, username, studentId, responses,gradedResults,finalScore}
        });
        res.json({message: 'Session Saved',session});
    }catch(err){
        console.error('Error in saveSession()->',err);
        res.json({error:'Could not save session'});
    }
};

const getSessions = async (req, res)=>{
    try{
        const sessions = await prisma.session.findMany();
        res.json(sessions);
    }catch(err){
        console.error('Error in getSessions()->',err);
        res.status(500).json({error:'Could not get sessions'});
    }
}

const loadSession = async(req,res)=>{
    const {title} = req.params;
    //const {studentId} = req.body;
    const studentId = '1234';
    console.log(title);
    if(!title || !studentId) return res.status(400).json({error: 'Missing lab title or Student Id'});
    try{
        const session = await prisma.session.findUnique({
            where:{labTitle_studentId: {labTitle:title,studentId}}
        });
        if(!session){
            return res.status(404).json({error: 'Session not found'});
        }
        //console.log(JSON.stringify(session));
        res.json(session);
    }catch(err){
        console.error('Error in getSession()->',err);
        res.json(500).json({error:'Count not get session'});
    }
}

module.exports = { saveSession, loadSession, getSessions };