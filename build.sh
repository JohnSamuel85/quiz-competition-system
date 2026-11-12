#!/usr/bin/env bash
# Render Build Script for Unified Single-Service Deployment
set -o errexit

echo "=========================================="
echo "  BUILDING UNIFIED AETHELGARD QUIZ SERVICE "
echo "=========================================="

echo "[1/3] Installing Python backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "[2/3] Installing Node.js frontend dependencies..."
cd frontend
npm install --production=false

echo "[3/3] Compiling production Next.js frontend..."
npm run build
cd ..

echo "=========================================="
echo "  BUILD COMPLETE & READY FOR PRODUCTION!   "
echo "=========================================="
