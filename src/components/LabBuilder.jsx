import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function QuestionEditor({ q, onChange }) {
    //onChange passed down from the parent so everything stays in sync
  const update = (field, value) => {
    onChange({ ...q, [field]: value }); //field is the placeholder for any property
    //properties of questionBlock blockType, type, prompt, desc
  };

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
        onChange={(e) => {
            const value = e.target.value;
            //find a. b. .... z. 
            const subQuestions = value
            .split('\n')
            .filter(line => /^[a-z]\./i.test(line.trim()))
            .map(line => line.trim());
            onChange({...q, desc:value, subQuestions});
        }}
      />

        {q.subQuestions && q.subQuestions.length>0 && (
        <ul className="ml-4 list-disc text-gray-700">
            {q.subQuestions.map((sq,i)=>{
                return <li key={i}>{sq}</li>
            })}
        </ul>
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
    </div>
  );
}

function TextImageEditor({block, onChange}){
    const [image, setImage] = useState();
    const update = (field,value) =>{
        const type = image ? "img" : "text";
        onChange({...block, [field]:value, type})
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
                // onChange={e=> onChange({...block, content: e.target.value})}
                onPaste={async (e)=>{
                    //find item from clipboard that is an image
                    const item = Array.from(e.clipboardData.items).find(i=>i.type.startsWith("image/"));
                    if(item){
                        const file = item.getAsFile(); //ge tthe image file
                        const url = URL.createObjectURL(file);
                        setImage(url);
                        update("content",image);
                        e.preventDefault();
                    }
                }}
            />
            {image && (
                <div className="my-2">
                    <img src={image} alt="Pasted" style={{maxWidth: "100%"}} />
                    <div className="text-xs text-gray-500">Image preview (not saved in Markdown)</div>
                </div>
                )}
        </div>
    )
}

function LabBuilder(){
    const [blocks, setBlocks] = useState([]); //directions, questions, etc
    const [title, setTitle] = useState([]);

    const addTextImageBlock = () => { //type can be text, or image?
        setBlocks([
            ...blocks, {id: Date.now(), blockType: "material",type: "", content: ""}
        ]);
    
    }

    const addQuestionBlock = () => {
        setBlocks([
        ...blocks,
        { id: Date.now(), blockType: "question", type: "q_short",prompt: "", desc: "", subQuestions:[] }
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
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <input 
            type="text"
            className="w-full border p-3 text-xl font-semibold mb-6"
            placdeholder="Enter lab title"
            value={title}
            onChange={(e)=> setTitle(e.target.value)}
            onKeyDown={(e)=>{
                if(e.key=== "Enter"){
                    e.preventDefault();
                    saveLab();
                }
            }}
        />

        {blocks.map((block) => (
            block.blockType === "material" ? 
            (
                <TextImageEditor
                key={block.id}
                block={block}
                onChange={(updated) => updateBlock(block.id, updated)}
                />
            ) : ( //type is short, code or textarea
                <QuestionEditor
                key={block.id}
                q={block}
                onChange={(updated) => updateBlock(block.id, updated)}
                />
            )
        ))}
        <button 
            onClick={addTextImageBlock}
            className="bg-green-600 text-white px-4 py-2 rounded mr-2"
        >
            Add text/image 📷 
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


