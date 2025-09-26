export const createQuestion = () => ({
  id: Date.now().toString(),
  blockType: "question",
  type: "short", //defaults to short
  prompt: "",
  desc: "",
  key: "",
  subQuestions: []
});

export const createMaterial = () => ({
  id: Date.now().toString(),
  blockType: "material",
  content: "",
  images: [] //array of base64 strings
});