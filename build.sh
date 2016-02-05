#!/bin/bash
# Sets up out cloudamp api server to be run in production

echo "Generating startup script"
./node_modules/pm2/bin/pm2 startup amazon