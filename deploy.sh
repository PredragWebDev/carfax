#!/bin/bash
set -e

IMAGE_NAME="nikita/carfax-backend:latest"
INSTALL_DIR="/home/ubuntu/test"

# Build image locally
docker build -t $IMAGE_NAME ./src
# Send bzip'd image to docker host via ssh
docker save $IMAGE_NAME | bzip2 | ssh carfax-backend "bunzip2 | docker load"
# Copy docker-compose to host
scp ./docker-compose.prod.yml carfax-backend:$INSTALL_DIR/docker-compose.yml
# Copy prod mongo env to host
scp ./mongo.env carfax-backend:$INSTALL_DIR
# Copy prod env to host
scp ./src/prod.env carfax-backend:$INSTALL_DIR
# Copy nginx config to host
scp -r ./nginx carfax-backend:$INSTALL_DIR
# Copy prod backup env to host
scp ./backup.env carfax-backend:$INSTALL_DIR
# Copy backup folder to host
scp -r ./mgob carfax-backend:$INSTALL_DIR
# Restart to latest image
ssh carfax-backend "cd /home/ubuntu/test && docker-compose up -d --force-recreate"