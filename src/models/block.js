export const createQuestion = () => ({
  id: Date.now(),
  blockType: "question",
  type: "q_short", //defaults to q_short
  prompt: "",
  desc: "",
  subQuestions: []
});

export const createMaterial = () => ({
  id: Date.now(),
  blockType: "material",
  type: "",
  content: ""
});