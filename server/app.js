const express = require('express');
const cors = require('cors');
require('dotenv').config({path: '../.env'});

const gradeRoutes = require("./routes/gradeRoutes");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app  = express();
app.use(cors());
app.use(express.json());

console.log("Using Open AI Key:",process.env.OPENAI_API_KEY);

//health check
app.get('/', (req,res)=>{
    res.send('Lab Creator Backend is running!');
})

const PORT = process.env.SERVER_PORT || 4000;
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
})


app.use('/api/grade',gradeRoutes);