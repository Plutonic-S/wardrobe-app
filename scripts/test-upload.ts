/**
 * Test script for wardrobe image upload
 * 
 * Usage: npx tsx scripts/test-upload.ts
 */

import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3000/api/wardrobe/upload';
const IMAGE_PATH = path.join(process.cwd(), 'public', 'tshirt.png');

async function testUpload() {
  console.log('🧪 Starting Upload Test...\n');
  
  // Step 1: Check if image exists
  if (!fs.existsSync(IMAGE_PATH)) {
    console.error('❌ Image not found:', IMAGE_PATH);
    process.exit(1);
  }
  
  console.log('✅ Image found:', IMAGE_PATH);
  const stats = fs.statSync(IMAGE_PATH);
  console.log(`📏 File size: ${(stats.size / 1024).toFixed(2)} KB\n`);
  
  // Step 2: Read image file
  const imageBuffer = fs.readFileSync(IMAGE_PATH);
  const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
  const imageFile = new File([imageBlob], 'tshirt.png', { type: 'image/png' });
  
  // Step 3: Create form data
  const formData = new FormData();
  formData.append('file', imageFile);
  
  // Step 4: Get authentication token
  const token = process.env.TEST_TOKEN || await getAuthToken();
  if (!token) {
    console.error('❌ No authentication token found');
    console.log('💡 Set TEST_TOKEN environment variable or login first');
    process.exit(1);
  }
  
  console.log('🔑 Using authentication token:', token.substring(0, 20) + '...\n');
  
  // Step 5: Upload image
  try {
    console.log('📤 Uploading image to:', API_URL);
    console.log('⏳ Please wait...\n');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let FormData set it with boundary
      },
      body: formData,
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Upload successful!\n');
      console.log('📊 Response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.data?.imageId) {
        console.log('\n🎉 Next steps:');
        console.log(`1. Check processing status: GET /api/wardrobe/images/${data.data.imageId}`);
        console.log('2. Wait for background processing to complete (5-15 seconds)');
        console.log('3. View in wardrobe: GET /api/wardrobe');
      }
    } else {
      console.log('❌ Upload failed!\n');
      console.log('📊 Response:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n🔍 Status:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Error during upload:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

/**
 * Helper: Get authentication token by logging in
 */
async function getAuthToken(): Promise<string | null> {
  console.log('🔐 No token found, attempting to login...\n');
  
  const username = process.env.TEST_USERNAME || 'testuser';
  const password = process.env.TEST_PASSWORD || 'testpass123';
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.data?.token) {
      console.log('✅ Login successful!\n');
      return data.data.token;
    } else {
      console.error('❌ Login failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return null;
  }
}

// Run test
testUpload();
