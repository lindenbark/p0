FROM node:carbon
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install -g npm@6.0.1
RUN npm install
COPY . .
EXPOSE 10001-10010
CMD npm run start
