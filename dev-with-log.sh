#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Generate timestamped log filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/reasonote-dev_${TIMESTAMP}.log"

echo "Starting Reasonote development server with logging to ${LOG_FILE}"

# Check if ansifilter is installed
if command -v ansifilter &> /dev/null; then
    echo "Using ansifilter to strip colors from log output"
    FORCE_COLOR=true yarn dev 2>&1 | tee >(ansifilter > "${LOG_FILE}")
else
    # Try to install ansifilter
    echo "ansifilter not found, attempting to install..."
    if command -v brew &> /dev/null; then
        if brew install ansifilter &> /dev/null; then
            echo "ansifilter installed successfully, using it for log output"
            FORCE_COLOR=true yarn dev 2>&1 | tee >(ansifilter > "${LOG_FILE}")
        else
            echo "Failed to install ansifilter, falling back to stdbuf+sed"
            FORCE_COLOR=true yarn dev 2>&1 | tee >(stdbuf -o0 sed 's/\x1b\[[0-9;]*m//g' > "${LOG_FILE}")
        fi
    else
        echo "Homebrew not found, falling back to stdbuf+sed"
        FORCE_COLOR=true yarn dev 2>&1 | tee >(stdbuf -o0 sed 's/\x1b\[[0-9;]*m//g' > "${LOG_FILE}")
    fi
fi 