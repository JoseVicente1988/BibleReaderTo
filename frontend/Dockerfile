FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || yarn || pnpm i

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build || yarn build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY package.json ./
RUN npm i --omit=dev
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm","start"]
