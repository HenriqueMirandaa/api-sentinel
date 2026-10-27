FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json apps/api/
COPY apps/worker/package*.json apps/worker/
COPY apps/web/package*.json apps/web/
RUN npm install
COPY . .

FROM base AS api
RUN npm run build --workspace apps/api
EXPOSE 3001
CMD ["npm", "run", "start", "--workspace", "apps/api"]

FROM base AS worker
RUN npm run build --workspace apps/worker
CMD ["npm", "run", "start", "--workspace", "apps/worker"]
