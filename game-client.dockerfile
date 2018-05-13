FROM node:carbon as build-client
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install -g npm@6.0.1
RUN npm install
COPY . .
RUN npm run build

FROM abiosoft/caddy
EXPOSE 80
COPY --from=build-client /usr/src/app/dist /var/www/
