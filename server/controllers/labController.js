const axios = require('axios');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const loadLab = async(req,res)=>{

    try{
        const {assignmentId, title} = req.query; //searching lab by title which probably isn't the best 
        console.log('here are the params',assignmentId, title);
        let lab = await prisma.lab.findUnique({
            where: { assignmentId:Number(assignmentId) },
        });
        if(!lab){ //lab doesn't exist, create a new one 
            lab = await prisma.lab.create({
                data:{
                    title: title || 'Untitled Lab',
                    blocks:{},
                    assignmentId:Number(assignmentId),
                    sessions:{create:[]}
                }
            })
            console.log('created new empty lab',lab);
        }
        
        return res.json(lab);

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