const axios = require('axios');
require('dotenv').config();


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
        If the response is an exact copy of the answer key and the question type is "textarea", give a 0.
        Respond in JSON: {"score": number, "feedback": string}`;

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

module.exports = { gradeQuestion };