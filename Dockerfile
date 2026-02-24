# Stage 1: Build the frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
# Use --legacy-peer-deps if you have dependency conflicts
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build the backend and serve
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for psycopg2 and other tools
RUN apt-get update && apt-get install -y 
    libpq-dev 
    gcc 
    curl 
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the built frontend from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Copy the backend code
COPY backend/ ./backend/

# Set working directory to backend to match the app structure
WORKDIR /app/backend

# The dist folder is at /app/dist
# Our app.py logic will now find it because we added it to possible paths

ENV PORT=10000
EXPOSE 10000

# Run the application
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "app:app", "--bind", "0.0.0.0:10000"]
