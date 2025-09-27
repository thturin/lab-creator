import axios from "axios";
import {useState} from 'react';
//require('dotenv').config();



function LabPreview({ blocks, title}) {
    const [responses,setResponses]= useState({});
    const [gradedResults, setGradedResults]=useState({}); //object, not id
    const [finalScore, setFinalScore] = useState();

    const allQuestions = [
        //filter questions without subquestions
        ...blocks.filter(b=>b.blockType==="question" && (!b.subQuestions || b.subQuestions.length===0))        
        //filter questions with subquestions
        ,...blocks.filter(b=>b.blockType==="question" && b.subQuestions.length>0).flatMap(b=>b.subQuestions)
        // const arr = [[1, 2], [3, 4]];
        // const result = arr.flatMap(x => x);
        // console.log(result); // [1, 2, 3, 4]
    ];
    const calculateFinalScore = ()=>{
        //loop through allQuestions and return json
        let finalScore = 0;
        const details = allQuestions.map((q,i)=>{           
            const score = gradedResults[q.id] ? parseFloat(gradedResults[q.id].score) :0;
            //console.log(`score ${score} for ${q.id}`);
            finalScore += score;
            return {
                number:i+1,
                score
            }
        });
        return {score:finalScore, details};
        // {
        //     score: 12,
        //     details: {
        //                 number:1,
        //                 score:0
        //     }
        // }
    };
   
    const submitResponses = async () => {
        for (const [questionId, userAnswer] of Object.entries(responses)) {
            //questionId is a string
            console.log(responses);
            let answerKey='';
            let question ='';
            let type='';
            //THIS ASSUMES SUB QUESTIONS DO NOT HAVE SUB QUESTIONS
            for(const block of blocks){
                if (block.blockType === 'question' && 
                    block.subQuestions.length===0 &&
                    block.id===questionId){
                        answerKey=block.key;
                        question=block.prompt;
                        type=block.type;
                        break;
                }
                if(block.blockType==='question'&&
                    block.subQuestions.length>0){
                        for(const sq of block.subQuestions){
                            if(sq.id===questionId){
                                answerKey=sq.key;
                                question=sq.prompt;
                                type=sq.type;
                                break;
                            }
                        }                       
                    }
            }
            try {
                //console.log(`${process.env.REACT_APP_SERVER_HOST}/grade`);
                const response = await axios.post(`${process.env.REACT_APP_SERVER_HOST}/grade`, {
                    userAnswer,
                    answerKey,
                    question,
                    questionType:type
                });
                console.log("Grading results", response.data);

                setGradedResults(prev=>({
                    ...prev, //copy all previous graded results
                    [questionId]: { //add or update current gradedResult with questionId
                        score: response.data.score,
                        feedback:response.data.feedback
                    }
                }));
                //   "123": { score: 1, feedback: "Good!" },
                //   "456": { score: 0, feedback: "Try again." }    
            } catch (err) {
                console.error("Error grading in LabPreview [LabPreview.jsx]");
            }
        }
        setFinalScore(calculateFinalScore());
    }

    return (
        <>
            {/* LAB PREVIEW */}
            <div className="mt-8 p-6 border rounded bg-gray-100">
                <h2 className="text-xl font-bold mb-4">Lab Preview</h2>
            </div>
            <div>
                <h3 className="font-semibold mb-2">{title}</h3>
            </div>
            {blocks.map((block, i) => (
                <div key={block.id || i} className="mb-6">
                    {block.blockType === "material" ? (
                        <> {/*<></> allows you to return multiple elements together*/}
                            {/* Show images */}
                            {block.images && block.images.length > 0 && (
                                <div className="my-2 flex flex-wrap gap-2">
                                    {block.images.map((src, idx) => (
                                        <img key={idx} src={src} alt={`Material ${i}`} style={{ maxWidth: "100%" }} />
                                    ))}
                                </div>
                            )}
                            {/* Show reactQuill html  */}
                            <div className="mt-2 p-2 border bg-gray-50"
                                dangerouslySetInnerHTML={{ __html: block.content }} />
                        </>
                    ) : (  //   QUESITON TYPE
                        <>
                            <div>
                                <div className="font-semibold mb-1" dangerouslySetInnerHTML={{ __html: block.prompt }} />
                                {/* <div className="mb-2 text-gray-700" dangerouslySetInnerHTML={{ __html: block.desc }} /> */}
                                {block.subQuestions.length === 0 && (
                                    <>
                                        {block.type === "short" &&
                                            (<input type="text"
                                                className="w-full border p-2 mb-2"
                                                placeholder="Your answer..."
                                                value={responses[block.id] || ""} //...responses is a shallow copy
                                                onChange={e => setResponses({ ...responses, [block.id]: e.target.value })}
                                            //new responses object created, copies all previous respones and sets 
                                            //the value for the current block.id to the new input value
                                            // responses = {
                                            //     123: "Answer for block 123",
                                            //     456: "Answer for block 456"
                                            //     }
                                            //  responses = {
                                            //     123: " New Answer for block 123",
                                            //     456: "Answer for block 456"
                                            //     }
                                            />)}
                                        {block.type === "textarea" &&
                                            (<textarea
                                                className="w-full border p-2 mb-2"
                                                rows={3}
                                                placeholder="Your answer..."
                                                value={responses[block.id] || ""} //OVERWRITE CURRENT VALUE AT BLOCK.ID
                                                onChange={e => setResponses({ ...responses, [block.id]: e.target.value })}
                                            />)}
                                        {block.type === "code" &&
                                            (<textarea
                                                className="w-full border font-mono p-2 mb-2"
                                                rows={6}
                                                placeholder="Your code..."
                                                value={responses[block.id] || ""}
                                                onChange={e => setResponses({ ...responses, [block.id]: e.target.value })}
                                            />)}


                                        {gradedResults[block.id] ? (
                                            <div className="mt-2 p-2 bg-green-50 border rounded text-sm">
                                                <div><strong>Score:</strong> {gradedResults[block.id].score}</div>
                                                <div><strong>Feedback:</strong> {gradedResults[block.id].feedback}</div>
                                            </div>
                                        ):(
                                            <div className="mt-2 p-2 bg-green-50 border rounded text-sm">
                                                <div><strong>Score:</strong> 0</div>
                                                <div><strong>Feedback:</strong> no response</div>
                                            </div>
                                        )}

                                    </>
                                )
                                }
                            </div>
                            {block.subQuestions && block.subQuestions.length > 0 && (
                                <div className="ml-4 border-l-2 pl-2">
                                    {block.subQuestions.map((sq, j) => (
                                        <div key={sq.id || j} className="mb-4">
                                            <div className="font-semibold mb-1" dangerouslySetInnerHTML={{ __html: sq.prompt }} />
                                            {/* <div className="mb-2 text-gray-700" dangerouslySetInnerHTML={{ __html: block.desc }} /> */}
                                            {sq.type === "short" && (
                                                <input type="text"
                                                    className="w-full border p-2 mb-2"
                                                    placeholder="Your answer..."
                                                    value={responses[sq.id] || ""}
                                                    onChange={e => setResponses({ ...responses, [sq.id]: e.target.value })}
                                                />
                                            )}
                                            {sq.type === "textarea" && (
                                                <textarea className="w-full border p-2 mb-2"
                                                    rows={3}
                                                    placeholder="Your answer..."
                                                    value={responses[sq.id] || ""}
                                                    onChange={e => setResponses({ ...responses, [sq.id]: e.target.value })}

                                                />
                                            )}
                                            {sq.type === "code" && (
                                                <textarea
                                                    className="w-full border font-mono p-2 mb-2"
                                                    rows={6}
                                                    placeholder="Your code..."
                                                    value={responses[sq.id] || ""}
                                                    onChange={e => setResponses({ ...responses, [sq.id]: e.target.value })}
                                                />
                                            )}
                                            {gradedResults[sq.id] && (
                                                <div className="mt-2 p-2 bg-green-50 border rounded text-sm">
                                                    <div><strong>Score:</strong> {gradedResults[sq.id].score}</div>
                                                    <div><strong>Feedback:</strong> {gradedResults[sq.id].feedback}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            ))}
            <button
                onClick={() => {
                    submitResponses();
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded mt-4"
            >
                Submit
            </button>
{/*OUTPUT FINAL SCORE */}
            {finalScore && (
                <div className="mb-6 p-4 border rounded bg-blue-50">
                    <h3 className="font-bold mb-2">Score</h3>
                        Total Score: {finalScore.score.toFixed(2)} / {finalScore.details.length}
                </div>
            )}
        </>
    )
}

export default LabPreview;