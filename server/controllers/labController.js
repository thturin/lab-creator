require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const deleteLab = async (req,res) =>{
    const {labId} = req.params;
    if (!labId) return res.status(400).json({ error: 'missing assignment Id' });

    try { //lab.delete will throw an error if no lab exists but deleteMany will not
        await prisma.lab.deleteMany({
            where: { id: Number(labId) }
        });
        res.json({ message: 'Lab deleted successfully' });
    } catch (err) {
        console.error('Error deleting lab:', err);
        res.status(500).json({ error: 'Failed to delete lab' });
    }
}

const loadLab = async(req,res)=>{
    try{
        const {assignmentId, title} = req.query; 
        let lab = await prisma.lab.findUnique({
            where: { assignmentId:Number(assignmentId) },
        });
        if(!lab){ //lab doesn't exist, create a new one 
            console.log('create new lab');
            lab = await prisma.lab.create({
                data:{
                    title: title,
                    blocks:[],
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
    //THIS ASSUMES 1:1 LAB: ASSIGNMENT. we avoid relying on database-genrasted IDs for upsert logic
    //one lab per assignment
    try{
        const {title, blocks,assignmentId} = req.body;
  
        const lab = await prisma.lab.upsert({
            where:{assignmentId:Number(assignmentId)},
            update:{
                title,
                blocks
            },
            create:{
                title,
                blocks,
                assignmentId:Number(assignmentId),
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


module.exports = { upsertLab, loadLab, getLabs, deleteLab};