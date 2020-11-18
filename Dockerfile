FROM node:14-alpine 

RUN mkdir /app && chown -R node:node /app

WORKDIR /app

COPY --chown=node:node package*.json ./

USER node

RUN npm install && npm cache clean --force --loglevel=error

COPY --chown=node:node . .

CMD [ "node", "main.js"]