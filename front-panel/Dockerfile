# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files first
COPY package*.json ./
COPY front-panel/package*.json ./front-panel/
COPY shared/package*.json ./shared/

# Install dependencies (workspace aware)
RUN npm install

# Copy rest of the code
COPY . .

# Build shared first
RUN npm run build -w shared

# Build front panel
RUN npm run build -w front-panel \
    && mv /app/front-panel/build/server/* /app/front-panel/build/server/index

    # ---------- Stage 2: Production ----------
FROM node:20-alpine

WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/front-panel/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/front-panel/package.json ./package.json

EXPOSE 3000

CMD ["node", "node_modules/@react-router/serve/dist/cli.js", "build/server/index/index.js"]