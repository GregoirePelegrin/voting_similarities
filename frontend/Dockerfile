FROM node:20-alpine AS builder

ARG NPM_CONFIG_PROXY
ARG NODE_TLS_REJECT_UNAUTHORIZED=0
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/tsconfig.json .
COPY frontend/vite.config.ts .
COPY frontend/index.html .
COPY frontend/public/ public/
COPY frontend/src/ src/
RUN npm run build

FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
