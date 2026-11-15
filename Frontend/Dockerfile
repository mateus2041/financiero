FROM node:22-slim

WORKDIR /app

COPY --chown=node:node package*.json ./

USER node
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY --chown=node:node public ./public
COPY --chown=node:node src ./src

EXPOSE 3000

CMD ["npm", "start"]