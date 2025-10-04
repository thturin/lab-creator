import axios from "axios";
import {useState, useEffect} from 'react';
import {createSession} from '../models/session';
import ReactQuill from 'react-quill';


function LabPreview({ blocks, title}) {
    console.log('LabPreview Mounted');
    const studentId = '1234';
    const [responses,setResponses]= useState({});
    const [gradedResults, setGradedResults]=useState({}); //object, not id
    const [finalResults, setFinalResults] = useState();
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const allQuestions = [
    //filter questions without subquestions
    ...blocks.filter(b=>b.blockType==="question" && (!b.subQuestions || b.subQuestions.length===0))        
    //filter questions with subquestions
    ,...blocks.filter(b=>b.blockType==="question" && b.subQuestions.length>0).flatMap(b=>b.subQuestions)
    // const arr = [[1, 2], [3, 4]];
    // const result = arr.flatMap(x => x);
    // console.log(result); // [1, 2, 3, 4]
    ];

    //LOAD SESSION
    useEffect(()=>{ //on  mount, load json 
        //extract responses, graded results and final score
        //ENSURE THIS HAPPENS BEFORE AUTOSAVE USE EFFECT
        const fetchSession = async()=>{
            try{
                    //console.log(`${process.env.REACT_APP_SERVER_HOST}/session/load-session/${title}`);
                    const response = await axios.get(`${process.env.REACT_APP_SERVER_HOST}/session/load-session/${title}`);
                    if(response.data.responses&& Object.keys((response.data.responses).length>0)) setResponses(response.data.responses);
                       // Only set if gradedResults is not empty
                    if (response.data.gradedResults && Object.keys(response.data.gradedResults).length > 0) {
                        setGradedResults(response.data.gradedResults);
                    }
                    // Only set if finalScore exists
                    if (response.data.finalScore && response.data.finalScore.totalScore !== undefined) {
                        setFinalResults(response.data.finalScore.totalScore);
                    }
                    setSessionLoaded(true);
                }catch(err){
                    console.error('Error in getResponse()',err);
                };
        } 
    fetchSession();
    },[]);

    //SAVE SESSION - save 
    useEffect(()=>{ //useeffect cannot be async
        console.log(title,studentId,sessionLoaded);
        if(!title || !studentId) return; //if not title was created or studentId is not found, don't update
       // if(sessionLoaded){ doesn't solve issue for race
       
            const session = createSession();
            session.labInfo.title = title;
            session.responses = responses;
            session.gradedResults = gradedResults;
    
        // username and studentID are currently defaulted
        //do not need await because we are not receving json
        axios.post(`${process.env.REACT_APP_SERVER_HOST}/session/save-session`,session)
        .catch(err=>{
            console.log('save session error',err);
        }); 
    },[responses,gradedResults,finalResults]);

    const submitResponses = async () => {
        alert('Submitted!');
        let newGradedResults = {...gradedResults};//create a new grade results to add empty
        //LOOP THROUGH RESPONSES
        for (const [questionId, userAnswer] of Object.entries(responses)) {
            //questionId is a string
            let answerKey='';
            let question ='';
            let type='';
            //THIS ASSUMES SUB QUESTIONS DO NOT HAVE SUB QUESTIONS
            //LOOP THROUGH BLOCKS AND ASSIGN ANSWERKEY, QUESTIOHN, TYPE
            for(const block of blocks){ //FIND BLOCK 
                if (block.blockType === 'question' && 
                    block.subQuestions.length===0 &&
                    block.id===questionId){
                        answerKey=block.key;
                        question=block.prompt;
                        type=block.type;
                        break;
                }
                if(block.blockType==='question'&& //FIND SUBQUESTION BLOCK
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
                const response = await axios.post(`${process.env.REACT_APP_SERVER_HOST}/grade`, {
                    userAnswer,
                    answerKey,
                    question,
                    questionType:type
                });
                //UPDATED GRADEDRESULTS 
                newGradedResults ={
                    ...newGradedResults,
                    [questionId]: { //add or update current gradedResult with questionId
                        score: response.data.score,
                        feedback:response.data.feedback
                    }              
                }
                // setGradedResults(prev=>({
                //     ...prev, //copy all previous graded results
                //     [questionId]: { //add or update current gradedResult with questionId
                //         score: response.data.score,
                //         feedback:response.data.feedback
                //     }
                // }));
                //FOR QUESTIONS THAT WERE LEFT BLANK, CREATE A NEW OBJECT IN GRADEDRESULTS 
                //WITH SCORE 0 AND NO RESPONSE
            } catch (err) {
                console.error("Error grading in LabPreview [LabPreview.jsx]");
            }
        }
        allQuestions.forEach(q=>{
                    //if new gradedResults does not contain this id,
                    if(!newGradedResults[q.id]){
                        newGradedResults[q.id]={
                            score:0,
                            feedback: "no response"
                        }
                    }
                });
                setGradedResults(newGradedResults);
                console.log(gradedResults);
                //   "123": { score: 1, feedback: "Good!" },  
        //CALCULATE FINAL SCORE 
        // try{
        //     const response = await axios.post(`${process.env.REACT_APP_SERVER_HOST}/grade/calculate-score`,{
        //         gradedResults,
        //         title
        //     });
        //     setFinalResults(response.data.session.finalScore);
        //     // {
        //     //     "percent": null,
        //     //     "maxScore": 0,
        //     //     "totalScore": 0
        //     // }
        // }catch(err){
        //     console.error('error calculating final score',err);
        // }
    }

    return (
        <>
            {/* LAB PREVIEW */}
        <div className="ml-8">
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
                                        <ReactQuill
                                            value={responses[block.id] || ""}
                                            onChange={value => setResponses({ ...responses, [block.id]: value })}
                                            className="w-full mb-2"
                                            placeholder="Your answer..."
                                        />
                                       
                                        {finalResults &&  (gradedResults[block.id] ? (
                                            <div className="mt-2 p-2 bg-green-50 border rounded text-sm">
                                                <div><strong>Score:</strong> {gradedResults[block.id].score}</div>
                                                <div><strong>Feedback:</strong> {gradedResults[block.id].feedback}</div>
                                            </div>
                                        ):(
                                            <div className="mt-2 p-2 bg-green-50 border rounded text-sm">
                                                <div><strong>Score:</strong> 0</div>
                                                <div><strong>Feedback:</strong> no response</div>
                                            </div>
                                        ))}

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
                                                <ReactQuill
                                                    value={responses[sq.id] || ""}
                                                    onChange={value => setResponses({ ...responses, [sq.id]: value })}
                                                    className="w-full mb-2"
                                                    placeholder="Your answer..."
                                                />

                                            {finalResults && (gradedResults[sq.id] ? (
                                                <div className="mt-2 p-2 bg-green-50 border rounded text-sm">
                                                    <div><strong>Score:</strong> {gradedResults[sq.id].score}</div>
                                                    <div><strong>Feedback:</strong> {gradedResults[sq.id].feedback}</div>
                                                </div>
                                            ):(
                                                <div className="mt-2 p-2 bg-green-50 border rounded text-sm">
                                                    <div><strong>Score:</strong> 0</div>
                                                    <div><strong>Feedback:</strong> no response</div>
                                                </div>
                                            ))}
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
            {gradedResults&& finalResults && (
                <div className="mb-6 p-4 border rounded bg-blue-50">
                    <h3 className="font-bold mb-2">Score</h3>
                        Total Score: {parseFloat(finalResults.score).toFixed(2)} / {finalResults.maxScore} 
                                        {finalResults.percent}

                </div>
            )}
            </div>
        </>
    
    )
}


export default LabPreview;