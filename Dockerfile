FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --omit=dev && npm cache clean --force

COPY . .

RUN chown -R node:node /app
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node docker-healthcheck.js

CMD ["npm", "start"]