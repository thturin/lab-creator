import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {createQuestion, createMaterial} from "../models/block";



function QuestionEditor({ q, onQuestionChange, onQuestionDelete}) {
    //onChange passed down from the parent so everything stays in sync
  const update = (field, value) => {
    //ONCHANGE CREATES A NEW QUESTION OBJECT WITH UQPDATED FIELD  VALUE
    onQuestionChange({ ...q, [field]: value }); //field is the placeholder for any property
    //properties of questionBlock blockType, type, prompt, desc
  };

  //PROMPT TEXT BOX
  return (
    <div className="p-4 border rounded mb-4 bg-white shadow">
      <input
        type="text"
        placeholder="Prompt"
        className="w-full border p-2 mb-2"
        value={q.prompt}
        rows={3}
        onChange={(e) => {
            //dont use update because it cannot pass an object as is
            update("prompt", e.target.value);
        }}
      />
  
      <textarea
        placeholder="Description"
        className="w-full border p-2 font-mono mb-2"
        rows="3"
        value={q.desc}
        onChange={(e) => update("desc",e.target.value)}
      />

        {q.subQuestions && q.subQuestions.length > 0 && (
            <div className="ml-4 border-l-2 pl-2">
                {q.subQuestions.map((sq, i) => (
                    <QuestionEditor
                        key={sq.id}
                        q={sq}
                        onQuestionChange={
                            //pass the updated Sub Q from child to parent in
                            //updatedSubQ
                            updatedSubQ=>{ 
                            const updatedSubs = q.subQuestions.map((sub,idx)=>
                                idx === i ? updatedSubQ : sub
                            );
                             // Call parent's onQuestionChange to update the parent question
                            onQuestionChange({...q, subQuestions:updatedSubs});
                        }}
                        onQuestionDelete={()=>{
                            //filter everything but the q to delete
                            const updatedSubs = q.subQuestions.filter((_,idx)=>idx!==i);
                            onQuestionChange({...q,subQuestions:updatedSubs});
                        }}                        
                    />
                ))}
            </div>
        )}

      <select
        className="border p-2"
        value={q.type}
        onChange={(e) => update("type", e.target.value)}
      >
        <option value="q_short">Short Answer</option>
        <option value="q_textarea">Paragraph</option>
        <option value="q_code">Code Response</option>
      </select>

       <button
            onClick={()=>{
                const nextIndex = (q.subQuestions?.length || 0);
                const nextLetter = String.fromCharCode(97+nextIndex); //97=a
                const newSubQ = createQuestion();
                newSubQ.prompt = `${nextLetter}.`;
                const updatedSubs = [...(q.subQuestions || []),newSubQ];
                onQuestionChange({...q,subQuestions: updatedSubs}); //send to parent updated  q's and subQuestions
            }}
            className="bg-green-600 text-white px-4 py-2 rounded"
        >
            Add Sub Question
        </button>
        <button
            onClick={onQuestionDelete}
            className="bg-red-600 text-white px-2 py-1 rounded ml-2"
        >
            Delete
        </button>
        
    </div>
  );
}

function MaterialEditor({block, onMaterialChange, onMaterialDelete}){
    const [image, setImage] = useState();
    const update = (field,value) =>{
        const type = image ? "img" : "text";
        //ONCHANGE CREATES A NEW BLOCK OBJECT WITH UPDATED FIELD AND TYPE VALUES 
        onMaterialChange({...block, [field]:value, type})
        //text image block properties blockType, type, content
    }
    return(
        <div className="p-4 border rounded mb-4 bg-white shadow">
            <textarea
                placeholder="Paste image or write here"
                rows = {8}
                className="w-full border p-2 font-mono mb-2"
                value={block.content}
                onChange={e=>{
                    //console.log(e.target.value);
                    update("content",e.target.value);}
                }
                onKeyDown={e=>{
                    if(e.key === "Enter" && !e.shiftKey){
                        e.preventDefault();
                        update("content", e.target.value);
                        
                    }
                }}
                onPaste={async (e)=>{
                    //find item from clipboard that is an image
                    const item = Array.from(e.clipboardData.items).find(i=>i.type.startsWith("image/"));
                    if(item){
                        const file = item.getAsFile(); //ge tthe image file
                        const reader = new FileReader();
                        reader.onload = (ev)=>{ //executes once image file has been converted to base64 data URL
                            const imgMarkdown = `![](${ev.target.result})`;
                            console.log(`imgMarkdown ${imgMarkdown}`);
                            const start = e.target.selectionStart;
                            const end = e.target.selectionEnd;
                            let newValue =
                                block.content.substring(0, start) + imgMarkdown + block.content.substring(end);
                
                            update("content",imgMarkdown);
                        }
                        reader.readAsDataURL(file);
                        // const url = URL.createObjectURL(file);
                        // setImage(url);
                        // update("content",image);
                        e.preventDefault();
                    }
                }}
            />
            {/* {image && (
                <div className="my-2">
                    <img src={image} alt="Pasted" style={{maxWidth: "100%"}} />
                    <div className="text-xs text-gray-500">Image preview (not saved in Markdown)</div>
                </div>
                )} */}
            <div className="mt-2 p-2 border bg-gray-50">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        img:({node, ...props}) =>{
                            console.log('look here',props);
                            if(!props.src) return null;
                            return <img {...props} alt={props.alt} style={{maxWidth:"100%"}} />;
                        }
                    }}
                >
                    {block.content}
                </ReactMarkdown>
            </div>
       
            <button
            onClick={onMaterialDelete}
            className="bg-red-600 text-white px-2 py-1 rounded ml-2"
            >
                Delete
            </button>
        </div>
    )
}

function LabBuilder(){
    const [blocks, setBlocks] = useState([]); //directions, questions, etc
    const [title, setTitle] = useState("");

    const deleteBlock = (id) =>{
        setBlocks(blocks.filter(b=> b.id !== id)); //remove block with id
    }

    const addMaterialBlock = () => { //type can be text, or image?
        setBlocks([
            ...blocks, 
            createMaterial()
        ]);
    
    }

    const addQuestionBlock = () => {

        setBlocks([
        ...blocks,
        createQuestion()
        ]);
    };

    const updateBlock = (id, updated) => {
        setBlocks(blocks.map((b) => (b.id === id ? updated : b)));
    };

    const saveLab = () => {
        const lab = { title: title, blocks};
        localStorage.setItem("labData", JSON.stringify(lab));
        console.log("Lab JSON:", lab);
        //alert("Lab saved! Check console for JSON.");
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4" style={{whiteSpace: "pre-line"}}>
            {title}
        </h1>
        <textarea 
            type="text"
            className="w-full border p-3 text-xl font-semibold mb-6"
            placeholder="Enter lab title"
            value={title}
            onChange={(e)=> setTitle(e.target.value)}
            onKeyDown={(e)=>{
                if(e.key=== "Enter"){
                    e.preventDefault();
                    saveLab();
                }
            }}
        />

    {/* DISPLAY BLOCKS */}
        {blocks.map((block) => (
            block.blockType === "material" ? 
            (
                <MaterialEditor
                key={block.id}
                block={block}
                onMaterialChange={(updatedBlock) => updateBlock(block.id, updatedBlock)}
                onMaterialDelete={()=>deleteBlock(block.id)}
                />
            ) : ( //type is short, code or textarea
                <QuestionEditor
                    key={block.id}
                    q={block}
                    // YOU MUST ALWAYS PASS A FUNCTION AN EVENT HANDLER
                    //updatedBlock is the new version of the block passed and updated from child
                    onQuestionChange={(updatedBlock) => updateBlock(block.id, updatedBlock)}
                    onQuestionDelete={()=>deleteBlock(block.id)}
                />
            )
        ))}
    
    {/* BUTTONS */}
        <button 
            onClick={addMaterialBlock}
            className="bg-green-600 text-white px-4 py-2 rounded mr-2"
        >
            Add Materials
        </button>
        <button
            onClick={addQuestionBlock}
            className="bg-green-600 text-white px-4 py-2 rounded mr-2"
        >
            ➕ Add Question
        </button>
        <button
            onClick={saveLab}
            className="bg-blue-600 text-white px-4 py-2 rounded"
        >
            💾 Save Lab
        </button>
        </div>
    );
}

export default  LabBuilder;


