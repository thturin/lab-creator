const axios = require('axios');
require('dotenv').config();
const OpenAI = require('openai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const calculateScore = async (req, res) => {
    console.log('--------calculating score-----------');
    console.time('calculateScore');
    const { gradedResults, labId, userId } = req.body;
    //console.log(Array.isArray(gradedResults));
    if (!gradedResults) return res.status(400).json({ error: 'gradedResults is missing' });

    let maxPoints = Object.keys(gradedResults).length;
    let totalPoints = 0;

    for (const key in gradedResults) {
        totalPoints += gradedResults[key].score;
    }

    let percent = ((totalPoints / maxPoints) * 100).toFixed(1);

    const finalScore = {
        percent,
        maxScore: maxPoints,
        totalScore: totalPoints
    };
    console.log(finalScore);

    try {
        console.time('prismaUpdate');
        const updatedSession = await prisma.session.update({
            where: { labId_userId: { labId, userId } },
            data: { finalScore }
        });
        console.timeEnd('prismaUpdate');
        console.timeEnd('calculateScore');
        //console.log(updatedSession);
        return res.json({ session: updatedSession });
    } catch (err) {
        console.error('Error in calculateScore', err);
        return res.status(500).json({ error: 'error calculating score' });
    }
}

const gradeQuestion = async (req, res) => {
    const { userAnswer, answerKey, question, questionType } = req.body;
    //console.log(userAnswer,answerKey,question);
    if (!userAnswer || !answerKey) {
        //might be a question with subquestions 
        return res.status(400).json({ error: 'No user response or answer key' });
    }

    try {
        const prompt = `compare the student's answer to the answer key. 
        Answer Key: ${answerKey}
        Student Answer: ${userAnswer}
        Question: ${question}
        Question Type: ${questionType}
        Is the student's answer correct? Give a score from 0, 0.5 or 1 and a brief feedback.
        The students are learning so it's best to give good feedback and be leniant on scoring.
        Do not take deduct points for grammar mistakes and misspelling.
        If their response is similar to the answer key, do not take points off. 
        Responses will be wrapped in React Quill. 
        Respond in JSON: {"score": number, "feedback": string}`;
        //console.log(prompt);

        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 100,
                temperature: 0.2
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        //HANDLE THE GPT message
        const gptOutput = response.data.choices[0].message.content;
        let result;
        try {
            result = JSON.parse(gptOutput);
        } catch {
            result = { score: null, feedback: message };
        }
        return res.json(result);
    } catch (err) {
        console.error(`Error in gradeQuestion() [gradeController]`, err.response?.data || err.message);
        return res.status(500).json({ error: 'Failed to grade answer' });
    }
};

const buildPrompt = ({ userAnswer, answerKey, question, questionType, AIPrompt }) => {
    const basePrompt = AIPrompt || `The response will be be in html but ignore all html artifacts and just analyze the text.
            Is the student's answer correct? Give a score from 0 to 1 and a brief feedback.
            If the response is empty, just respond with 'response is empty'
            Do not take off points for grammar mistakes and misspelling.`;

    return `compare the student's answer to the answer key. 
            Answer Key: ${answerKey}
            Student Answer: ${userAnswer}
            Question: ${question}
            Question Type: ${questionType}
            AI Prompt: ${basePrompt}. The response will be in HTML but ignore all html artifacts. Just analyze the text. Give a score from 0 to 1 and a brief feedback. 
            Respond in JSON: {"score": number, "feedback": string}`;
};

const gradeWithDeepSeek = async ({ userAnswer, answerKey, question, questionType, AIPrompt }) => {
    if (!userAnswer || !answerKey) throw new Error('No user response or answer key');

    const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: process.env.DEEPSEEK_API_KEY,
    });

    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: buildPrompt({ userAnswer, answerKey, question, questionType, AIPrompt }) }],
        model: "deepseek-chat",
    });

    let result = completion.choices[0].message.content;
    try {
        result = JSON.parse(result);
    } catch (err) {
        console.log('error parsing JSON in deepseek handler', err);
        result = { score: 0, feedback: "error parsing json" };
    }
    return result;
};

const gradeQuestionDeepSeek = async (req, res) => {
    const { userAnswer, answerKey } = req.body;
    if (!userAnswer || !answerKey) return res.status(400).json({ error: 'No user response or answer key' });

    try {
        const result = await gradeWithDeepSeek(req.body); //req.body = userAnswer, answerKey, question, questionType, AIPrompt
        return res.json(result);
    } catch (err) {
        console.log('Error in accessing deep seek api. Request failed.', err.message);
        return res.status(400).json({ error: 'cannot access deep seek api' });
    }
};


const regradeSession = async (req, res) => {
    const { labId, userId, responses, questionLookup, dryRun = true, aiPrompt } = req.body;
    if (!labId || !userId || !responses || !questionLookup) {
        return res.status(400).json({ error: 'labId, userId, responses, questionLookup are required' });
    }

    try {
        const regradedResults = {};

        for (const [questionId, userAnswer] of Object.entries(responses)) {
            const details = questionLookup[questionId];//prompt key type
            if (!details) {
                console.warn(`question metadata missing for id ${questionId} in regradeSession`);
                continue;
            }

            try {
                const result = await gradeWithDeepSeek({
                    userAnswer,
                    answerKey: details.key,
                    question: details.prompt,
                    questionType: details.type,
                    AIPrompt: aiPrompt
                });

                regradedResults[questionId] = {
                    score: result.score,
                    feedback: result.feedback
                };
            } catch (err) {
                console.error(`Error grading question ${questionId} during regrade`, err.message);
            }
        }

        //if a response was missing from student, there will be no questionId key. It will 
        //not be in the regradedResults. give an automatic 0 and no response submitted.
        for (const questionId of Object.keys(questionLookup)) {
            if (!regradedResults[questionId]) {
                regradedResults[questionId] = {
                    score: 0,
                    feedback: 'No response submitted'
                };
            }
        }

        const maxPoints = Object.keys(regradedResults).length;
        const totalPoints = Object.values(regradedResults).reduce((sum, result) => sum + result.score, 0);
        const finalScore = {
            percent: maxPoints ? ((totalPoints / maxPoints) * 100).toFixed(1) : '0.0',
            maxScore: maxPoints,
            totalScore: totalPoints
        };

        const responsePayload = {
            gradedResults: regradedResults,
            finalScore,
            rawScore: totalPoints
        };

        if (dryRun) { //if the admin is doing dryRun, return data
            return res.json(responsePayload);
        }

        const updatedSession = await prisma.session.update({
            where: { labId_userId: { labId, userId } },
            data: { finalScore, gradedResults: regradedResults }
        });

        return res.json({
            ...responsePayload,
            session: updatedSession
        });
    } catch (err) {
        console.error('regradeSession error', err.message);
        return res.status(500).json({ error: 'Failed to regrade lab session' });
    }
};

module.exports = { regradeSession, gradeQuestion, gradeQuestionDeepSeek, calculateScore };