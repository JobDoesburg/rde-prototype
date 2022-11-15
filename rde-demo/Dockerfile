FROM node:latest as build

WORKDIR /usr/src/app

COPY rde-js-client/package.json rde-js-client/package-lock.json ./
RUN npm install

COPY rde-js-client/tsconfig.json rde-js-client/webpack.config.js rde-js-client/webpack.prod.js ./

COPY rde-js-client/src/ ./src/
RUN npm run build

FROM nginx:alpine
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY index.html /usr/share/nginx/html/index.html
COPY demo.js /usr/share/nginx/html/demo.js
EXPOSE 80
