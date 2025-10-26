#!/bin/bash

# Test Wardrobe Upload with cURL
# Usage: bash scripts/test-upload.sh

echo "🧪 Testing Wardrobe Upload API"
echo "================================"
echo ""

# Configuration
API_URL="http://localhost:3000/api/wardrobe/upload"
IMAGE_PATH="public/tshirt.png"
LOGIN_URL="http://localhost:3000/api/auth/login"

# Check if image exists
if [ ! -f "$IMAGE_PATH" ]; then
    echo "❌ Error: Image not found at $IMAGE_PATH"
    exit 1
fi

echo "✅ Image found: $IMAGE_PATH"
FILE_SIZE=$(du -h "$IMAGE_PATH" | cut -f1)
echo "📏 File size: $FILE_SIZE"
echo ""

# Step 1: Login to get token
echo "🔐 Step 1: Logging in..."
echo ""

# Use environment variables or defaults
USERNAME="${TEST_USERNAME:-testuser}"
PASSWORD="${TEST_PASSWORD:-testpass123}"

LOGIN_RESPONSE=$(curl -s -X POST "$LOGIN_URL" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed or no token received"
    echo "Response: $LOGIN_RESPONSE"
    echo ""
    echo "💡 Make sure:"
    echo "   1. Development server is running (npm run dev)"
    echo "   2. You have a user account created"
    echo "   3. Or set TEST_USERNAME and TEST_PASSWORD environment variables"
    exit 1
fi

echo "✅ Login successful!"
echo "🔑 Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Upload image
echo "📤 Step 2: Uploading image..."
echo ""

UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$IMAGE_PATH")

echo "📊 Response:"
echo "$UPLOAD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UPLOAD_RESPONSE"
echo ""

# Check if upload was successful
if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Upload successful!"
    
    # Extract imageId
    IMAGE_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"imageId":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$IMAGE_ID" ]; then
        echo ""
        echo "🎉 Next steps:"
        echo "   1. Image ID: $IMAGE_ID"
        echo "   2. Processing status: Check in 5-15 seconds"
        echo "   3. View in wardrobe: curl -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/wardrobe"
    fi
else
    echo "❌ Upload failed!"
    echo "   Check the response above for error details"
fi

echo ""
echo "================================"
echo "✅ Test complete!"
