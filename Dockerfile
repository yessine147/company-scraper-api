# Use latest LTS Node (22) for modern runtime
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Copy only package.json to control dependencies (ignore old lockfiles)
COPY package.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of the app
COPY . .

# Expose HTTP port
EXPOSE 3000

# Run the API service
CMD ["node", "index.js"]