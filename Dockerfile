# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Enable EasyPanel/Vite build-time variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_MAPBOX_TOKEN

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install --frozen-lockfile || npm install

# Build the app
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Robust nginx config for SPA and EasyPanel
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
  echo '  listen 80;' >> /etc/nginx/conf.d/default.conf && \
  echo '  server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
  echo '  location / {' >> /etc/nginx/conf.d/default.conf && \
  echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
  echo '    index index.html index.htm;' >> /etc/nginx/conf.d/default.conf && \
  echo '    try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
  echo '  }' >> /etc/nginx/conf.d/default.conf && \
  echo '  error_page 500 502 503 504 /50x.html;' >> /etc/nginx/conf.d/default.conf && \
  echo '  location = /50x.html {' >> /etc/nginx/conf.d/default.conf && \
  echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
  echo '  }' >> /etc/nginx/conf.d/default.conf && \
  echo '}' >> /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
