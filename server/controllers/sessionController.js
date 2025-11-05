const axios = require('axios');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const saveSession = async (req, res) => {
    const { session } = req.body;
    const { responses, gradedResults, finalScore, userId, labId, labTitle, username } = session;

    if (!labId || !userId) {
        return res.status(400).json({ error: 'Missing labId or userId' });
    }

    try {
        //upsert updates if session exists, or create if it does not
        const newSession = await prisma.session.upsert({
            where: { labId_userId: { labId, userId } },
            update: { 
                labTitle,
                username,
                responses,
                gradedResults,
                finalScore
             },
            create: {
                labId, 
                labTitle,
                username,
                userId,
                responses,
                gradedResults,
                finalScore 
            }
        });
        res.json({ message: 'Session Saved', newSession });
    } catch (err) {
        console.error('Error in saveSession()->', err);
        res.json({ error: 'Could not save session' });
    }
};

const getSessions = async (req, res) => {
    try {
        const sessions = await prisma.session.findMany();
        res.json(sessions);
    } catch (err) {
        console.error('Error in getSessions()->', err);
        res.status(500).json({ error: 'Could not get sessions' });
    }
}

const loadSession = async (req, res) => {
    const { labId } = req.params;
    const { userId, username, title } = req.query;

    const numLabId = Number(labId);
    const numUserId = Number(userId);
    try {
        // const lab = await prisma.lab.findUnique({
        //     where:{id:numLabId}
        // });
        // if(!lab) return res.status(404).json({error:'Lab not found'});

        let session = await prisma.session.findUnique({
            where: { labId_userId: { labId: numLabId, userId: numUserId } }
        });
        if (!session) {
            console.log('No session found, creating new one');
            session = await prisma.session.create({
                data: {
                    labTitle: title,
                    labId: numLabId,

                    userId: numUserId,
                    username,
                    responses: {},
                    gradedResults: {},
                    gradedResults: {},
                    finalScore: {},
                }
            });
            console.log('Created New Session');
        }
        console.log(JSON.stringify(session));
        return res.json({ session });
    } catch (err) {
        console.error('Error in getSession()->', err);
        res.json(500).json({ error: 'Count not get session' });
    }
}

module.exports = { saveSession, loadSession, getSessions };