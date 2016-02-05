#!/bin/bash
# Starts our express js app for the cloudamp api

echo "Running cloudamp api"
node app.js > out.log &
APP_PID=$!
echo $APP_PID > APP_PID
