#!/bin/bash
#
# Cloudflare Tunnel Setup Script for STEM Center Backend
#
# This script helps you set up a Cloudflare Tunnel to expose your
# self-hosted backend server to the internet securely.
#
# Prerequisites:
# 1. A Cloudflare account
# 2. A domain added to Cloudflare (free tier works!)
# 3. cloudflared CLI installed
#
# Usage: ./setup-tunnel.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     STEM Center Backend - Cloudflare Tunnel Setup         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
TUNNEL_NAME="stem-center-backend"
BACKEND_PORT=${BACKEND_PORT:-3001}

# Step 1: Check if cloudflared is installed
echo -e "${YELLOW}Step 1: Checking cloudflared installation...${NC}"
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}Error: cloudflared is not installed${NC}"
    echo ""
    echo "Install cloudflared using one of these methods:"
    echo ""
    echo "  macOS (Homebrew):"
    echo "    brew install cloudflare/cloudflare/cloudflared"
    echo ""
    echo "  Windows:"
    echo "    Download from: https://github.com/cloudflare/cloudflared/releases"
    echo ""
    echo "  Linux (Debian/Ubuntu):"
    echo "    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb"
    echo "    sudo dpkg -i cloudflared.deb"
    echo ""
    echo "  Linux (RHEL/CentOS):"
    echo "    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.rpm -o cloudflared.rpm"
    echo "    sudo rpm -i cloudflared.rpm"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ cloudflared is installed${NC}"

# Step 2: Check if logged in
echo ""
echo -e "${YELLOW}Step 2: Checking Cloudflare authentication...${NC}"
if ! cloudflared tunnel list &> /dev/null; then
    echo "You need to login to Cloudflare first."
    echo "This will open a browser window for authentication."
    echo ""
    read -p "Press Enter to continue with login..."
    cloudflared tunnel login
fi
echo -e "${GREEN}✓ Authenticated with Cloudflare${NC}"

# Step 3: Check if tunnel exists or create it
echo ""
echo -e "${YELLOW}Step 3: Setting up tunnel '${TUNNEL_NAME}'...${NC}"
if cloudflared tunnel list | grep -q "$TUNNEL_NAME"; then
    echo -e "${GREEN}✓ Tunnel '${TUNNEL_NAME}' already exists${NC}"
    TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
else
    echo "Creating new tunnel '${TUNNEL_NAME}'..."
    cloudflared tunnel create "$TUNNEL_NAME"
    TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
    echo -e "${GREEN}✓ Tunnel created with ID: ${TUNNEL_ID}${NC}"
fi

# Step 4: Get domain information
echo ""
echo -e "${YELLOW}Step 4: Configure DNS routing...${NC}"
echo ""
echo "Enter the hostname for your API (e.g., api.yourdomain.com):"
read -p "Hostname: " HOSTNAME

if [ -z "$HOSTNAME" ]; then
    echo -e "${RED}Error: Hostname is required${NC}"
    exit 1
fi

# Add DNS route
echo "Adding DNS route for ${HOSTNAME}..."
cloudflared tunnel route dns "$TUNNEL_NAME" "$HOSTNAME" 2>/dev/null || echo "DNS route may already exist"
echo -e "${GREEN}✓ DNS route configured${NC}"

# Step 5: Create config file
echo ""
echo -e "${YELLOW}Step 5: Creating configuration file...${NC}"
CLOUDFLARED_DIR="$HOME/.cloudflared"
CONFIG_FILE="$CLOUDFLARED_DIR/config.yml"
CREDENTIALS_FILE="$CLOUDFLARED_DIR/${TUNNEL_ID}.json"

cat > "$CONFIG_FILE" << EOF
# Cloudflare Tunnel Configuration for STEM Center Backend
# Generated on $(date)

tunnel: $TUNNEL_ID
credentials-file: $CREDENTIALS_FILE

ingress:
  - hostname: $HOSTNAME
    service: http://localhost:$BACKEND_PORT
    originRequest:
      connectTimeout: 30s
  - service: http_status:404
EOF

echo -e "${GREEN}✓ Config file created at: ${CONFIG_FILE}${NC}"

# Step 6: Summary and next steps
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete!                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Tunnel Details:"
echo "  Tunnel ID: $TUNNEL_ID"
echo "  Hostname:  $HOSTNAME"
echo "  Backend:   http://localhost:$BACKEND_PORT"
echo ""
echo "Config File: $CONFIG_FILE"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Start your backend server:"
echo "   cd server && npm run dev"
echo ""
echo "2. Start the tunnel (in a separate terminal):"
echo "   cloudflared tunnel run $TUNNEL_NAME"
echo ""
echo "3. Test the connection:"
echo "   curl https://$HOSTNAME/api/health"
echo ""
echo "4. Update your Vercel environment variables:"
echo "   BACKEND_URL=https://$HOSTNAME"
echo "   BACKEND_JWT_SECRET=<your-secret-key>"
echo "   AI_PROVIDER=backend"
echo ""
echo -e "${YELLOW}To run as a system service (Linux):${NC}"
echo "   sudo cloudflared service install"
echo "   sudo systemctl start cloudflared"
echo "   sudo systemctl enable cloudflared"
echo ""
echo -e "${YELLOW}To run as a service (Windows):${NC}"
echo "   cloudflared service install"
echo "   net start cloudflared"
echo ""
