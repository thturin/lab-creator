import axios from "axios";
import {useState} from 'react';
//require('dotenv').config();



function LabPreview({ blocks, title}) {
    const [responses,setResponses]= useState({});
    const [gradedResults, setGradedResults]=useState([]);

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
                console.log(`${process.env.REACT_APP_SERVER_HOST}/grade`);
                const response = await axios.post(`${process.env.REACT_APP_SERVER_HOST}/grade`, {
                    userAnswer,
                    answerKey,
                    question,
                    questionType:type
                });
                console.log("Grading results", response.data);
                setGradedResults(prev=>[...prev,{
                    id:questionId,
                    score:response.data.score,
                    feedback:response.data.feedback
                }]);
            } catch (err) {
                console.error("Error grading in LabPreview [LabPreview.jsx]");
            }
        }




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
                                                value={responses[block.id] || ""}
                                                onChange={e => setResponses({ ...responses, [block.id]: e.target.value })}
                                            //new responses object created, copies all previous respones and sets 
                                            //the value for the current block.id to the new input value
                                            // responses = {
                                            //     123: "Answer for block 123",
                                            //     456: "Answer for block 456"
                                            //     }
                                            />)}
                                        {block.type === "textarea" &&
                                            (<textarea
                                                className="w-full border p-2 mb-2"
                                                rows={3}
                                                placeholder="Your answer..."
                                                value={responses[block.id] || ""}
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
        </>
    )
}

export default LabPreview;