FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
ENV NODE_ENV=development
RUN npm install

COPY . .

EXPOSE 4000

CMD ["npx","nodemon", "app.js"]
