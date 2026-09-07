FROM node:22-bookworm-slim

WORKDIR /opt/app

ENV HOST=0.0.0.0 \
    PORT=1337 \
    NODE_ENV=production \
    STRAPI_TELEMETRY_DISABLED=true

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN NODE_OPTIONS=--max-old-space-size=1536 npm run build \
    && npm prune --omit=dev --no-audit --no-fund \
    && chown -R node:node /opt/app

USER node

EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:1337/_health').then((response) => process.exit(response.status === 204 ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "run", "start"]
