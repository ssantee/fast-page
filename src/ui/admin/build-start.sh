#!/bin/bash
docker build -t nextjs-docker . &&
docker run -p 3000:3000 nextjs-docker
