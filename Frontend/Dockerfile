FROM node:24-slim

WORKDIR /app

RUN chown node:node /app

<<<<<<< HEAD
COPY --chown=node:node package*.json ./
=======
RUN npm ci
>>>>>>> 37fa596c1605a4d561e0ff704b1b6cba5c5ab799

USER node
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY --chown=node:node public ./public
COPY --chown=node:node src ./src

EXPOSE 3000

CMD ["npm", "start"]