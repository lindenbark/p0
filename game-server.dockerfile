FROM node:carbon
WORKDIR /usr/src/app
COPY . .
RUN npm install -g npm@6.0.1
RUN npm install
EXPOSE 10001
CMD npm run start
