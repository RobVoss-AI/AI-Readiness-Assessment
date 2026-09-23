FROM node:22-alpine

WORKDIR /app

# The OpenAI SDK requires Node 22+; install exactly what package-lock.json pins
COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN chown -R node:node /app
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node docker-healthcheck.js

CMD ["npm", "start"]
