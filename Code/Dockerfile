FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/servidor ./servidor
COPY --from=build /app/plantillas ./plantillas
COPY --from=build /app/css ./css
COPY --from=build /app/assets ./assets
EXPOSE 3000
CMD ["node", "servidor/index.js"]
