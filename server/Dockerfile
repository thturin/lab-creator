FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

#copy prisma folder from build context (host machine)
#int oa folder named prisma in the containers current working directory
COPY prisma ./prisma
#need to create @prisma in node_modules
RUN npx prisma generate --schema=./prisma/schema.prisma

COPY . .

EXPOSE 4000

CMD ["npx","nodemon", "app.js"]
