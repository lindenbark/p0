FROM node:carbon as build-client
COPY package*.json ./
RUN npm install -g npm@6.0.1
RUN npm install
COPY . .
RUN npm run build

FROM abiosoft/caddy
EXPOSE 8080
COPY --from=build-client dist /var/www/
