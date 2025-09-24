#!/bin/bash



echo "Starting frontend..."
cd "client"
#npm install 
npm start

echo "Starting backend..."
cd "../server" 
#npm install 
npm run dev &
