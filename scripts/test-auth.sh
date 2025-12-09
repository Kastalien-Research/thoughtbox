#!/bin/bash
# Test script for authentication middleware
# Usage: ./scripts/test-auth.sh [port] [token]

set -e

PORT=${1:-1729}
TOKEN=${2:-"test-secret-token"}
BASE_URL="http://localhost:${PORT}"

echo "🧪 Testing Thoughtbox Authentication Middleware"
echo "================================================"
echo "Port: $PORT"
echo "Token: $TOKEN"
echo ""

# Test 1: Health endpoint (should work without auth)
echo "✓ Test 1: Health endpoint (no auth required)"
curl -s -w "\nStatus: %{http_code}\n" "${BASE_URL}/health" | head -5
echo ""

# Test 2: MCP GET endpoint (should work without auth)
echo "✓ Test 2: MCP info endpoint (no auth required)"
curl -s -w "\nStatus: %{http_code}\n" "${BASE_URL}/mcp" | head -5
echo ""

# Test 3: MCP POST without auth header (should fail if AUTH_TOKEN set)
echo "✗ Test 3: MCP POST without Authorization header (should fail with 401)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' \
  "${BASE_URL}/mcp"
echo ""

# Test 4: MCP POST with wrong token (should fail with 403)
echo "✗ Test 4: MCP POST with wrong token (should fail with 403)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong-token" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' \
  "${BASE_URL}/mcp"
echo ""

# Test 5: MCP POST with correct token (should succeed with 200)
echo "✓ Test 5: MCP POST with correct token (should succeed)"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' \
  "${BASE_URL}/mcp" | head -10
echo ""

echo "================================================"
echo "✅ Auth middleware tests complete"
echo ""
echo "Expected results when AUTH_TOKEN is set:"
echo "  - Tests 1-2: 200 OK (health and info don't require auth)"
echo "  - Test 3: 401 Unauthorized (no auth header)"
echo "  - Test 4: 403 Forbidden (wrong token)"
echo "  - Test 5: 200 OK (correct token)"
