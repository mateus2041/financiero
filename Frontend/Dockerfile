FROM node:24-slim

WORKDIR /app

RUN chown node:node /app

COPY --chown=node:node package*.json ./

USER node
RUN npm ci --ignore-scripts --no-audit --no-fund

USER root
RUN mkdir -p /app/node_modules/.cache \
    && chown -R node:node /app/node_modules/.cache

USER node

COPY --chown=node:node public ./public
COPY --chown=node:node src ./src

EXPOSE 3000

CMD ["npm", "start"]