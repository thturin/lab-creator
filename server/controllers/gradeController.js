const axios = require('axios');
require('dotenv').config();
const OpenAI = require('openai');




const gradeQuestion = async (req, res) => {
    const {userAnswer, answerKey, question, questionType} = req.body;
    console.log(userAnswer,answerKey,question);
    if(!userAnswer || !answerKey){
        //might be a question with subquestions 
        return res.status(400).json({error:'No user response or answer key'});
    }

    try{
        const prompt = `compare the student's answer to the answer key. 
        Answer Key: ${answerKey}
        Student Answer: ${userAnswer}
        Question: ${question}
        Question Type: ${questionType}
        Is the student's answer correct? Give a score from 0 to 1 and a brief feedback.
        The students are learning so it's best to give good feedback and be leniant on scoring.
        Do not take off points for grammar mistakes and misspelling.
        Respond in JSON: {"score": number, "feedback": string}`;
        console.log(prompt);

        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model:"gpt-3.5-turbo",
                messages:[{role:"user", content:prompt}],
                max_tokens:100,
                temperature:0.2
            },
            {
                headers:{
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type":"application/json"
                }
            }
        );
        //HANDLE THE GPT message
        const gptOutput = response.data.choices[0].message.content;
        let result;
        try{
            result = JSON.parse(gptOutput);
        }catch{
            result = {score:null, feedback: message};
        }
        return res.json(result);
    }catch(err){
        console.error(`Error in gradeQuestion() [gradeController]`,err.response?.data || err.message);
        return res.status(500).json({error: 'Failed to grade answer'});
    }
};

const gradeQuestionDeepSeek = async (req,res)=>{
    const {userAnswer, answerKey, question, questionType} = req.body;
    if(!userAnswer || !answerKey){
        //might be a question with subquestions 
        return res.status(400).json({error:'No user response or answer key'});
    }

    try{
        const prompt = `compare the student's answer to the answer key. 
            Answer Key: ${answerKey}
            Student Answer: ${userAnswer}
            Question: ${question}
            Question Type: ${questionType}
            Is the student's answer correct? Give a score from 0 to 1 and a brief feedback.
            If the response is an exact copy of the answer key, give a 0.
            If the response is empty, just respond with 'response is empty'
            Do not take off points for grammar mistakes and misspelling.
            Respond in JSON: {"score": number, "feedback": string}`;

        const openai = new OpenAI({
                baseURL: 'https://api.deepseek.com',
                apiKey: process.env.DEEPSEEK_API_KEY,
        });
    
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: prompt }],
            model: "deepseek-chat",
        });

        //console.log(completion.choices[0].message.content);
        let result = completion.choices[0].message.content;
        try{
            result = JSON.parse(result);
        }catch(err){
            console.log('error parsing JSON in deepseek handler',err);
            result = {score:0,feedback:"error parsing json"};
        }
        return res.json(result);
    }catch(err){
        console.log('Error in accessing deep seek api. Request failed.',err);
        return res.status(400).json({error:'cannot access deep seek api'});
    }

}

module.exports = { gradeQuestion, gradeQuestionDeepSeek };