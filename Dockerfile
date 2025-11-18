# Thoughtbox MCP Server - HTTP Transport (Smithery)
FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build HTTP transport
RUN npm run build:http

# Create directories for persistent storage
# Structure mirrors URI hierarchy: thoughtbox://mental-models/{tag}/{model}
RUN mkdir -p /root/.thoughtbox/mental-models/debugging \
    /root/.thoughtbox/mental-models/planning \
    /root/.thoughtbox/mental-models/decision-making \
    /root/.thoughtbox/mental-models/risk-analysis \
    /root/.thoughtbox/mental-models/estimation \
    /root/.thoughtbox/mental-models/prioritization \
    /root/.thoughtbox/mental-models/communication \
    /root/.thoughtbox/mental-models/architecture \
    /root/.thoughtbox/mental-models/validation \
    /root/.thoughtbox/notebooks \
    /root/.thoughtbox/memory \
    /root/.npm

# Expose default port
EXPOSE 3000

# Run HTTP server
CMD ["node", ".smithery/index.cjs"]
