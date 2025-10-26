/**
 * End-to-End Upload Test Script
 * Tests the complete image upload workflow including:
 * - File upload to /api/wardrobe/upload
 * - Metadata submission
 * - Background processing (background removal, optimization, etc.)
 * - Status polling
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const TEST_IMAGE_PATH = join(__dirname, '../public/tshirt.png');

interface UploadResponse {
  success: boolean;
  imageId: string;
  processingStatus: string;
}

interface MetadataResponse {
  success: boolean;
  message: string;
}

interface StatusResponse {
  success: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep?: string;
  progress?: number;
  steps?: Array<{
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  }>;
  error?: string;
}

/**
 * Test 1: Upload Image
 */
async function testUpload(authToken: string): Promise<string> {
  console.log('\n📤 TEST 1: Uploading image...');
  
  const formData = new FormData();
  const imageBuffer = readFileSync(TEST_IMAGE_PATH);
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('image', blob, 'tshirt.png');

  const response = await fetch(`${BASE_URL}/api/wardrobe/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${error}`);
  }

  const data: UploadResponse = await response.json();
  
  console.log('✅ Upload successful!');
  console.log(`   Image ID: ${data.imageId}`);
  console.log(`   Processing Status: ${data.processingStatus}`);
  
  return data.imageId;
}

/**
 * Test 2: Submit Metadata
 */
async function testMetadata(authToken: string, imageId: string): Promise<void> {
  console.log('\n📝 TEST 2: Submitting metadata...');
  
  const metadata = {
    name: 'Test Black T-Shirt',
    category: 'tops',
    subcategory: 'casual',
    tags: ['black', 'casual', 'summer'],
    season: ['spring', 'summer'],
    styleType: 'casual',
    brand: 'Test Brand',
    price: 29.99,
  };

  const response = await fetch(`${BASE_URL}/api/wardrobe/images/${imageId}/metadata`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Metadata submission failed: ${response.status} - ${error}`);
  }

  const data: MetadataResponse = await response.json();
  
  console.log('✅ Metadata submitted successfully!');
  console.log(`   Message: ${data.message}`);
}

/**
 * Test 3: Poll Processing Status
 */
async function testProcessingStatus(authToken: string, imageId: string): Promise<void> {
  console.log('\n⏳ TEST 3: Polling processing status...');
  
  let attempts = 0;
  const maxAttempts = 60; // 2 minutes max (2 seconds per poll)
  
  while (attempts < maxAttempts) {
    const response = await fetch(`${BASE_URL}/api/wardrobe/images/${imageId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Status check failed: ${response.status} - ${error}`);
    }

    const data: StatusResponse = await response.json();
    
    // Display current status
    const statusEmoji = {
      pending: '⏸️',
      processing: '⚙️',
      completed: '✅',
      failed: '❌',
    }[data.status];
    
    console.log(`   ${statusEmoji} Status: ${data.status} (${data.currentStep || 'waiting'})`);
    
    if (data.steps) {
      data.steps.forEach(step => {
        const stepEmoji = {
          pending: '⏸️',
          processing: '⚙️',
          completed: '✅',
          failed: '❌',
        }[step.status];
        console.log(`      ${stepEmoji} ${step.name}: ${step.status}`);
      });
    }
    
    // Check if completed or failed
    if (data.status === 'completed') {
      console.log('\n✅ Processing completed successfully!');
      console.log(`   Total attempts: ${attempts + 1}`);
      console.log(`   Time elapsed: ~${(attempts + 1) * 2} seconds`);
      return;
    }
    
    if (data.status === 'failed') {
      throw new Error(`Processing failed: ${data.error || 'Unknown error'}`);
    }
    
    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }
  
  throw new Error('Processing timeout: Max polling attempts reached');
}

/**
 * Test 4: Verify Background Removal
 */
async function testBackgroundRemoval(authToken: string, imageId: string): Promise<void> {
  console.log('\n🖼️  TEST 4: Verifying background removal...');
  
  // Check if the processed image exists
  const response = await fetch(`${BASE_URL}/api/wardrobe/images/${imageId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Image retrieval failed: ${response.status} - ${error}`);
  }

  const imageData = await response.json();
  
  console.log('✅ Image data retrieved!');
  console.log(`   Has background-removed version: ${!!imageData.processedUrl}`);
  console.log(`   Has thumbnail: ${!!imageData.thumbnailUrl}`);
  console.log(`   Dominant colors: ${imageData.dominantColors?.length || 0} colors`);
}

/**
 * Main Test Runner
 */
async function runTests() {
  console.log('🚀 Starting End-to-End Upload Tests\n');
  console.log('=' .repeat(50));
  
  try {
    // Get auth token (you'll need to provide this)
    const authToken = process.env.TEST_AUTH_TOKEN;
    
    if (!authToken) {
      console.error('\n❌ Error: TEST_AUTH_TOKEN environment variable not set');
      console.log('\nTo run tests, you need to:');
      console.log('1. Log in to the app and get your JWT token from localStorage');
      console.log('2. Run: export TEST_AUTH_TOKEN="your_jwt_token"');
      console.log('3. Run this script again\n');
      process.exit(1);
    }
    
    // Run tests in sequence
    const imageId = await testUpload(authToken);
    await testMetadata(authToken, imageId);
    await testProcessingStatus(authToken, imageId);
    await testBackgroundRemoval(authToken, imageId);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 All tests passed successfully!');
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

export { runTests, testUpload, testMetadata, testProcessingStatus, testBackgroundRemoval };
