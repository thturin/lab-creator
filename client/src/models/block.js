export const createQuestion = () => ({
  id: Date.now(),
  blockType: "question",
  type: "short", //defaults to short
  prompt: "",
  desc: "",
  key: "",
  subQuestions: []
});

export const createMaterial = () => ({
  id: Date.now(),
  blockType: "material",
  content: "",
  images: [] //array of base64 strings
});