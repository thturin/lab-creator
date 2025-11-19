require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


const processImageURLString = (str) => {
    const base64Pattern = /src="data:image\/png;base64,[^"]+"/g;
    //let shortened='';
    while (str.includes('src="data:image/png;base64,')) {
        str = str.replace(base64Pattern, 'src="[BASE64_IMAGE_REMOVED]"');

    }
    return str;
}

const shortenImageUrl = (blocks) => {
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.blockType === 'material') {
            block['content'] = processImageURLString(block['content']);
            console.log(block['content']);
        } else if (block.blockType === 'question') {
            block['prompt'] = processImageURLString(block['prompt']);
            block['explanation'] = processImageURLString(block['explanation']);
            if (block.subQuestions && block.subQuestions.length > 0) {
                for (let j = 0 ; j<block.subQuestions.length; j++) {
                    const sq = block.subQuestions[j];
                    sq['prompt'] = processImageURLString(sq['prompt']);
                    sq['explanation'] = processImageURLString(sq['explanation']);
                }
            }
        }
    }
    return blocks;
};

const deleteLab = async (req, res) => {
    const { labId } = req.params;
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

const loadLab = async (req, res) => { //load existing lab or create a new one 
    try {
        const { assignmentId, title } = req.query;
        let lab = await prisma.lab.findUnique({
            where: { assignmentId: Number(assignmentId) },
        });
        if (!lab) { //lab doesn't exist, create a new one 
            console.log('create new lab');
            lab = await prisma.lab.create({
                data: {
                    title: title,
                    blocks: [],
                    assignmentId: Number(assignmentId),
                    sessions: { create: [] }
                }
            })
            console.log('created new empty lab', lab);
        }
        return res.json(lab);
    } catch (err) {
        console.error('Error in labController loabLab()', err);
        res.status(500).json({ error: 'Could not get lab' });
    }
}

const getLabs = async (req, res) => {
    try {
        const labs = await prisma.lab.findMany();
        return res.json(labs);
    } catch (err) {
        console.error('Error in labController getLabs()', err);
        res.status(500).json({ error: 'Could not get labs' });
    }
};

const getLab = async (req, res) => {
    try {
        const id = req.params.id;
        const lab = await prisma.lab.findUnique({
            where: {
                id: Number(id)
            }
        });
        if (!lab) return res.status(404).json({ error: 'lab not found' });

        let simplifiedLab = lab;
        simplifiedLab = {
            ...simplifiedLab,
            blocks:shortenImageUrl(simplifiedLab.blocks)
        };
        return res.json(simplifiedLab);

    } catch (err) {
        console.error('Error in labController getLab()', err.message);
        res.status(500).json({ error: 'Could not get lab' });
    }
};

const upsertLab = async (req, res) => {
    //THIS ASSUMES 1:1 LAB: ASSIGNMENT. we avoid relying on database-genrasted IDs for upsert logic
    //one lab per assignment
    try {
        const { title, blocks, assignmentId } = req.body;

        const lab = await prisma.lab.upsert({
            where: { assignmentId: Number(assignmentId) },
            update: {
                title,
                blocks
            },
            create: {
                title,
                blocks,
                assignmentId: Number(assignmentId),
                sessions: { create: [] }
            }
        });
        console.log('lab created or saved: ', lab);
        return res.json(lab); //return the lab
    } catch (err) {
        console.error('Error in labController upsertLab()', err);
        res.status(500).json({ error: 'Could not create or save lab' });
    }
}


module.exports = { upsertLab, loadLab, getLabs, deleteLab, getLab };