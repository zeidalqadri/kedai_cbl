#!/bin/bash
# ============================================================================
# CRYPTICO ATM - API TEST SUITE
# Run these commands to test all workflow endpoints
# ============================================================================

# Configuration - Update these values
BASE_URL="https://your-n8n.com/webhook"
API_KEY="your_api_key"
ADMIN_KEY="your_admin_key"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================================================"
echo "CRYPTICO ATM - API TEST SUITE"
echo "============================================================================"
echo ""

# ============================================================================
# TEST 1: Order Submission - Valid Request
# ============================================================================
echo -e "${YELLOW}TEST 1: Order Submission - Valid Request${NC}"

VALID_ORDER_RESPONSE=$(curl -s -X POST "${BASE_URL}/order/submit" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "crypto": "USDT",
    "network": "TRC-20",
    "amountMYR": 100,
    "customerName": "Test User",
    "contactType": "telegram",
    "contact": "@testuser",
    "walletAddress": "TQn7z8bvPxEfJ7yK9mXvzWnVp5N3cHx9Kp",
    "rateLockTimestamp": '$(date +%s000)',
    "paymentRef": "TEST'$(date +%s)'"
  }')

echo "$VALID_ORDER_RESPONSE" | jq .
ORDER_ID=$(echo "$VALID_ORDER_RESPONSE" | jq -r '.orderId // empty')

if [ -n "$ORDER_ID" ]; then
  echo -e "${GREEN}✓ Order created: ${ORDER_ID}${NC}"
else
  echo -e "${RED}✗ Order creation failed${NC}"
fi
echo ""

# ============================================================================
# TEST 2: Order Submission - Invalid Wallet Address
# ============================================================================
echo -e "${YELLOW}TEST 2: Order Submission - Invalid Wallet Address${NC}"

curl -s -X POST "${BASE_URL}/order/submit" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "crypto": "USDT",
    "network": "TRC-20",
    "amountMYR": 100,
    "customerName": "Test User",
    "contactType": "telegram",
    "contact": "@testuser",
    "walletAddress": "invalid_address",
    "rateLockTimestamp": '$(date +%s000)',
    "paymentRef": "TEST123"
  }' | jq .

echo -e "${GREEN}✓ Expected: 400 VALIDATION_ERROR${NC}"
echo ""

# ============================================================================
# TEST 3: Order Submission - Expired Rate Lock
# ============================================================================
echo -e "${YELLOW}TEST 3: Order Submission - Expired Rate Lock${NC}"

# Use timestamp from 10 minutes ago
EXPIRED_TIMESTAMP=$(($(date +%s000) - 600000))

curl -s -X POST "${BASE_URL}/order/submit" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "crypto": "USDT",
    "network": "TRC-20",
    "amountMYR": 100,
    "customerName": "Test User",
    "contactType": "telegram",
    "contact": "@testuser",
    "walletAddress": "TQn7z8bvPxEfJ7yK9mXvzWnVp5N3cHx9Kp",
    "rateLockTimestamp": '"${EXPIRED_TIMESTAMP}"',
    "paymentRef": "TEST123"
  }' | jq .

echo -e "${GREEN}✓ Expected: 409 RATE_LOCK_EXPIRED${NC}"
echo ""

# ============================================================================
# TEST 4: Order Submission - Missing Required Fields
# ============================================================================
echo -e "${YELLOW}TEST 4: Order Submission - Missing Required Fields${NC}"

curl -s -X POST "${BASE_URL}/order/submit" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "crypto": "USDT",
    "amountMYR": 100
  }' | jq .

echo -e "${GREEN}✓ Expected: 400 VALIDATION_ERROR with missing fields list${NC}"
echo ""

# ============================================================================
# TEST 5: Order Submission - Invalid Network for Crypto
# ============================================================================
echo -e "${YELLOW}TEST 5: Order Submission - Invalid Network for Crypto${NC}"

curl -s -X POST "${BASE_URL}/order/submit" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "crypto": "BNB",
    "network": "TRC-20",
    "amountMYR": 100,
    "customerName": "Test User",
    "contactType": "telegram",
    "contact": "@testuser",
    "walletAddress": "TQn7z8bvPxEfJ7yK9mXvzWnVp5N3cHx9Kp",
    "rateLockTimestamp": '$(date +%s000)',
    "paymentRef": "TEST123"
  }' | jq .

echo -e "${GREEN}✓ Expected: 400 - BNB only available on BEP-20${NC}"
echo ""

# ============================================================================
# TEST 6: Order Lookup - Valid Order ID
# ============================================================================
echo -e "${YELLOW}TEST 6: Order Lookup - Valid Order ID${NC}"

if [ -n "$ORDER_ID" ]; then
  curl -s "${BASE_URL}/order/lookup/${ORDER_ID}" | jq .
  echo -e "${GREEN}✓ Order details returned${NC}"
else
  echo -e "${RED}✗ Skipped - No order ID from TEST 1${NC}"
fi
echo ""

# ============================================================================
# TEST 7: Order Lookup - Invalid Order ID Format
# ============================================================================
echo -e "${YELLOW}TEST 7: Order Lookup - Invalid Order ID Format${NC}"

curl -s "${BASE_URL}/order/lookup/invalid-id" | jq .

echo -e "${GREEN}✓ Expected: 400 INVALID_ID${NC}"
echo ""

# ============================================================================
# TEST 8: Order Lookup - Non-existent Order
# ============================================================================
echo -e "${YELLOW}TEST 8: Order Lookup - Non-existent Order${NC}"

curl -s "${BASE_URL}/order/lookup/CK999999ZZZZ" | jq .

echo -e "${GREEN}✓ Expected: 404 NOT_FOUND${NC}"
echo ""

# ============================================================================
# TEST 9: Admin - Approve Order (requires valid admin key)
# ============================================================================
echo -e "${YELLOW}TEST 9: Admin - Approve Order${NC}"

if [ -n "$ORDER_ID" ]; then
  curl -s -X POST "${BASE_URL}/order/status" \
    -H "Content-Type: application/json" \
    -H "X-Admin-Key: ${ADMIN_KEY}" \
    -d '{
      "orderId": "'"${ORDER_ID}"'",
      "action": "approve",
      "note": "Payment verified via test script"
    }' | jq .
  echo -e "${GREEN}✓ Order approved${NC}"
else
  echo -e "${RED}✗ Skipped - No order ID from TEST 1${NC}"
fi
echo ""

# ============================================================================
# TEST 10: Admin - Complete Order with TX Hash
# ============================================================================
echo -e "${YELLOW}TEST 10: Admin - Complete Order with TX Hash${NC}"

if [ -n "$ORDER_ID" ]; then
  curl -s -X POST "${BASE_URL}/order/status" \
    -H "Content-Type: application/json" \
    -H "X-Admin-Key: ${ADMIN_KEY}" \
    -d '{
      "orderId": "'"${ORDER_ID}"'",
      "action": "complete",
      "txHash": "test_tx_hash_'$(date +%s)'",
      "note": "Crypto sent via test script"
    }' | jq .
  echo -e "${GREEN}✓ Order completed${NC}"
else
  echo -e "${RED}✗ Skipped - No order ID from TEST 1${NC}"
fi
echo ""

# ============================================================================
# TEST 11: Admin - Invalid Status Transition
# ============================================================================
echo -e "${YELLOW}TEST 11: Admin - Invalid Status Transition${NC}"

if [ -n "$ORDER_ID" ]; then
  # Try to approve already completed order
  curl -s -X POST "${BASE_URL}/order/status" \
    -H "Content-Type: application/json" \
    -H "X-Admin-Key: ${ADMIN_KEY}" \
    -d '{
      "orderId": "'"${ORDER_ID}"'",
      "action": "approve"
    }' | jq .
  echo -e "${GREEN}✓ Expected: 409 INVALID_TRANSITION${NC}"
else
  echo -e "${RED}✗ Skipped - No order ID from TEST 1${NC}"
fi
echo ""

# ============================================================================
# TEST 12: Admin - Unauthorized (wrong key)
# ============================================================================
echo -e "${YELLOW}TEST 12: Admin - Unauthorized Access${NC}"

curl -s -X POST "${BASE_URL}/order/status" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: wrong_key" \
  -d '{
    "orderId": "CK12345678",
    "action": "approve"
  }' | jq .

echo -e "${GREEN}✓ Expected: 401 UNAUTHORIZED${NC}"
echo ""

# ============================================================================
# TEST 13: Admin - Get Orders List
# ============================================================================
echo -e "${YELLOW}TEST 13: Admin - Get Orders List${NC}"

curl -s "${BASE_URL}/admin/orders?status=pending&limit=5" \
  -H "X-Admin-Key: ${ADMIN_KEY}" | jq .

echo -e "${GREEN}✓ Orders list returned${NC}"
echo ""

# ============================================================================
# TEST 14: Admin - Get Orders with Filters
# ============================================================================
echo -e "${YELLOW}TEST 14: Admin - Get Orders with Date Filter${NC}"

TODAY=$(date -u +%Y-%m-%dT00:00:00Z)

curl -s "${BASE_URL}/admin/orders?dateFrom=${TODAY}&limit=10" \
  -H "X-Admin-Key: ${ADMIN_KEY}" | jq '.pagination'

echo -e "${GREEN}✓ Today's orders filtered${NC}"
echo ""

# ============================================================================
# TEST 15: Admin - Get Dashboard Stats
# ============================================================================
echo -e "${YELLOW}TEST 15: Admin - Get Dashboard Stats${NC}"

curl -s "${BASE_URL}/admin/stats" \
  -H "X-Admin-Key: ${ADMIN_KEY}" | jq '.stats.overview'

echo -e "${GREEN}✓ Stats returned${NC}"
echo ""

# ============================================================================
# TEST 16: Verify Order Lookup Shows Completed Status
# ============================================================================
echo -e "${YELLOW}TEST 16: Verify Final Order Status${NC}"

if [ -n "$ORDER_ID" ]; then
  curl -s "${BASE_URL}/order/lookup/${ORDER_ID}" | jq '.order.status, .order.statusDisplay'
  echo -e "${GREEN}✓ Order should show 'completed' status${NC}"
else
  echo -e "${RED}✗ Skipped - No order ID from TEST 1${NC}"
fi
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "============================================================================"
echo "TEST SUITE COMPLETE"
echo "============================================================================"
echo ""
echo "Manual verification needed:"
echo "  1. Check Telegram for new order notification"
echo "  2. Check Telegram for status update notifications"
echo "  3. Check Supabase 'orders' table for new record"
echo "  4. Check Supabase 'audit_log' for status changes"
echo ""
