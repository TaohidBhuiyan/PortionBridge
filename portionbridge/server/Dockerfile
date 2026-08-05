FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies (production)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
