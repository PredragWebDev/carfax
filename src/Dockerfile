# 1. Build latest alpine LTS NodeJS
FROM node:lts-alpine

# Make dir & give correct permissions
RUN mkdir -p /app && chown -R node:node /app

# Set work dir
WORKDIR /app

# Copy package file
COPY package.json yarn.lock ./

# Set user to node
USER node

# Install packages
RUN yarn install --pure-lockfile

# Copy all files to our current work dir
COPY --chown=node:node . .

# Expose app port
EXPOSE 3000

# Start app
CMD yarn start