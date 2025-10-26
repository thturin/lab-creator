const axios = require('axios');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const loadLab = async(req,res)=>{
    try{
        const {title} = req.params; //searching lab by title which probably isn't the best 
        const lab = await prisma.lab.findUnique({
            where: { title }
        });
    }catch(err){
        console.error('Error in labController loabLab()',err);
        res.status(500).json({error:'Could not get lab'});
    }
}

const getLabs = async (req,res)=>{
    try{

        const labs =  await prisma.lab.findMany();
        res.json(labs);
    }catch(err){
        console.error('Error in labController getLabs()',err);
        res.status(500).json({error:'Could not get labs'});
    }
};

const upsertLab = async(req,res)=>{

    try{
        const {title, blocks,assignmentId,sessions} = req.body;
        //console.log(title, blocks);

        const lab = await prisma.lab.upsert({
            where:{assignmentId},
            update:{
                title,
                blocks
            },
            create:{
                title,
                blocks,
                assignmentId,
                sessions:{create: []}
            }
        });
        console.log('lab created or saved: ',lab);
        return res.json(lab); //return the lab
    }catch(err){
        console.error('Error in labController upsertLab()',err);
        res.status(500).json({error:'Could not create or save lab'});
    }
}


module.exports = { upsertLab, loadLab, getLabs};