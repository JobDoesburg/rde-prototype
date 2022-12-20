FROM node:latest as build

WORKDIR /usr/src/app

COPY rde-js-client/package.json rde-js-client/package-lock.json ./
RUN npm install

COPY rde-js-client/tsconfig.json rde-js-client/webpack.config.js rde-js-client/webpack.prod.js ./

COPY rde-js-client/src/ ./src/
RUN npm run build

FROM nginx:alpine
COPY --from=build /usr/src/app/dist /usr/share/nginx/html/rde-js-client/dist
COPY openjpeg.js /usr/share/nginx/html/openjpeg.js
COPY CSCA-NL-2022.json /usr/share/nginx/html/certificates.json
COPY index.html /usr/share/nginx/html/index.html
COPY ../app-debug.apk /usr/share/nginx/html/app-debug.apk
COPY ../Remote_Document_Encryption_in_SURFfilesender.pdf /usr/share/nginx/html/Remote_Document_Encryption_in_SURFfilesender.pdf
COPY demo.js /usr/share/nginx/html/demo.js.tmpl

CMD envsubst '${KEYSERVER_URL} ${PROXYSERVER_URL} ${PROXYSERVER_WS_URL} ${CERTIFICATE_JSON_URL}' < /usr/share/nginx/html/demo.js.tmpl > /usr/share/nginx/html/demo.js && nginx -g 'daemon off;'
EXPOSE 80
