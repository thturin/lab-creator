const express = require('express');
const cors = require('cors');
require('dotenv').config();

const gradeRoutes = require("./routes/gradeRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app  = express();
app.use(cors({
  origin: [
     process.env.CLIENT_URL, // e.g., http://localhost:13000 for local dev
    'http://lab-creator-client:3001', // Docker Compose service name for frontend
   'http://localhost:13001', // Docker Compose service name for frontend
    'http://0.0.0.0:13001'
  ],
  credentials:true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
app.use('/api/session',sessionRoutes);