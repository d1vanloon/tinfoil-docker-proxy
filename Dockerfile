FROM node:lts-alpine

WORKDIR /app
RUN chown node:node /app

USER node
COPY --chown=node:node package*.json ./

RUN npm ci --only=production

COPY --chown=node:node . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/index.js"]
