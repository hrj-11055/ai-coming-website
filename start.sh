#!/bin/bash

# AI News Management System - Startup Script for macOS/Linux
# This script works on both macOS and Linux systems

echo "========================================"
echo "   AI News Management System"
echo "========================================"
echo ""
echo "Starting server..."
echo "Server URL: http://localhost:3000"
echo "Admin Panel: http://localhost:3000/data-manager.html"
echo ""
echo "Press Ctrl+C to stop server"
echo "========================================"
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Run the server
node server-json.js
