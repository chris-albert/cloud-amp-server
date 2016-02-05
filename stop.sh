#!/bin/bash
# Stops our cloudamp api server
echo "Stopping cloudamp api"
sudo kill -9 `cat APP_PID`