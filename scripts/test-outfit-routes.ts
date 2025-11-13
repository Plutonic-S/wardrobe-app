// scripts/test-outfit-routes.ts
// Comprehensive test script for outfit API routes
// Run with: npx tsx scripts/test-outfit-routes.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results tracker
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helper function to log test results
function logTest(name: string, passed: boolean, message?: string) {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    if (message) console.log(`  ${colors.cyan}→${colors.reset} ${message}`);
  } else {
    failedTests++;
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (message) console.log(`  ${colors.red}→${colors.reset} ${message}`);
  }
}

// Helper function to make API requests
async function apiRequest(
  method: string,
  endpoint: string,
  token: string,
  body?: unknown
) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();

  return { response, data };
}

// Main test function
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bright}Outfit API Routes Test Suite${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  // Get authentication token from environment
  const token = process.env.TEST_AUTH_TOKEN;
  if (!token) {
    console.log(`${colors.red}Error: TEST_AUTH_TOKEN not found in .env.local${colors.reset}`);
    console.log('Please login and add your auth token to .env.local:');
    console.log('TEST_AUTH_TOKEN=your_token_here\n');
    process.exit(1);
  }

  // Get test cloth item IDs from environment
  const testTopId = process.env.TEST_TOP_ID;
  const testBottomId = process.env.TEST_BOTTOM_ID;
  const testFootwearId = process.env.TEST_FOOTWEAR_ID;

  if (!testTopId || !testBottomId || !testFootwearId) {
    console.log(`${colors.yellow}Warning: Test cloth item IDs not found in .env.local${colors.reset}`);
    console.log('For complete testing, add these to .env.local:');
    console.log('TEST_TOP_ID=your_top_cloth_id');
    console.log('TEST_BOTTOM_ID=your_bottom_cloth_id');
    console.log('TEST_FOOTWEAR_ID=your_footwear_cloth_id\n');
  }

  let createdOutfitId: string | null = null;

  try {
    // ========================================================================
    // TEST 1: POST /api/outfits - Create outfit (Dress Me mode)
    // ========================================================================
    console.log(`${colors.bright}Test Suite 1: Create Outfit${colors.reset}`);
    
    if (testTopId && testBottomId && testFootwearId) {
      const createPayload = {
        mode: 'dress-me',
        metadata: {
          name: 'Test Casual Outfit',
          description: 'A test outfit for API testing',
          tags: ['casual', 'summer'],
          occasion: 'daily',
          season: ['spring', 'summer'],
        },
        combination: {
          configuration: '3-part',
          items: {
            tops: testTopId,
            bottoms: testBottomId,
            footwear: testFootwearId,
            accessories: [],
          },
        },
      };

      const { response, data } = await apiRequest('POST', '/outfits', token, createPayload);
      
      logTest(
        'POST /api/outfits (Create Dress Me outfit)',
        response.status === 201 && data.success === true,
        response.status === 201 
          ? `Created outfit: ${data.data.outfit._id}`
          : `Status ${response.status}: ${data.message || 'Failed'}`
      );

      if (response.status === 201 && data.data?.outfit?._id) {
        createdOutfitId = data.data.outfit._id;
      }
    } else {
      console.log(`${colors.yellow}⊘ Skipping POST test - Missing test cloth IDs${colors.reset}\n`);
    }

    // Test validation errors
    const invalidPayload = {
      mode: 'dress-me',
      metadata: {
        name: '', // Invalid: empty name
        tags: [],
        season: [],
      },
    };

    const { response: invalidRes, data: invalidData } = await apiRequest(
      'POST',
      '/outfits',
      token,
      invalidPayload
    );
    
    logTest(
      'POST /api/outfits (Validation error handling)',
      invalidRes.status === 400 && invalidData.success === false,
      invalidRes.status === 400
        ? 'Correctly rejected invalid data'
        : `Expected 400, got ${invalidRes.status}`
    );

    console.log('');

    // ========================================================================
    // TEST 2: GET /api/outfits - Get all outfits
    // ========================================================================
    console.log(`${colors.bright}Test Suite 2: Get All Outfits${colors.reset}`);
    
    const { response: getAllRes, data: getAllData } = await apiRequest(
      'GET',
      '/outfits',
      token
    );
    
    logTest(
      'GET /api/outfits (Get all outfits)',
      getAllRes.status === 200 && getAllData.success === true,
      getAllRes.status === 200
        ? `Retrieved ${getAllData.data.outfits?.length || 0} outfits`
        : `Status ${getAllRes.status}: ${getAllData.message || 'Failed'}`
    );

    // Test with filters
    const { response: filterRes, data: filterData } = await apiRequest(
      'GET',
      '/outfits?mode=dress-me&limit=5&sortBy=createdAt&sortOrder=desc',
      token
    );
    
    logTest(
      'GET /api/outfits (With filters and pagination)',
      filterRes.status === 200 && filterData.success === true,
      filterRes.status === 200
        ? `Filtered results: ${filterData.data.outfits?.length || 0} outfits`
        : `Status ${filterRes.status}: ${filterData.message || 'Failed'}`
    );

    // Test with season filter
    const { response: seasonRes, data: seasonData } = await apiRequest(
      'GET',
      '/outfits?season=summer',
      token
    );
    
    logTest(
      'GET /api/outfits (Season filter)',
      seasonRes.status === 200 && seasonData.success === true,
      seasonRes.status === 200
        ? `Summer outfits: ${seasonData.data.outfits?.length || 0}`
        : `Status ${seasonRes.status}: ${seasonData.message || 'Failed'}`
    );

    console.log('');

    // ========================================================================
    // TEST 3: GET /api/outfits/[id] - Get single outfit
    // ========================================================================
    console.log(`${colors.bright}Test Suite 3: Get Single Outfit${colors.reset}`);
    
    if (createdOutfitId) {
      const { response: getOneRes, data: getOneData } = await apiRequest(
        'GET',
        `/outfits/${createdOutfitId}`,
        token
      );
      
      logTest(
        'GET /api/outfits/[id] (Get single outfit)',
        getOneRes.status === 200 && getOneData.success === true,
        getOneRes.status === 200
          ? `Retrieved: ${getOneData.data.metadata?.name || 'outfit'}`
          : `Status ${getOneRes.status}: ${getOneData.message || 'Failed'}`
      );
    } else {
      console.log(`${colors.yellow}⊘ Skipping GET [id] test - No outfit created${colors.reset}`);
    }

    // Test with invalid ID
    const { response: invalidIdRes, data: invalidIdData } = await apiRequest(
      'GET',
      '/outfits/000000000000000000000000',
      token
    );
    
    logTest(
      'GET /api/outfits/[id] (Not found handling)',
      invalidIdRes.status === 404 && invalidIdData.success === false,
      invalidIdRes.status === 404
        ? 'Correctly returned 404 for non-existent outfit'
        : `Expected 404, got ${invalidIdRes.status}`
    );

    console.log('');

    // ========================================================================
    // TEST 4: PATCH /api/outfits/[id] - Update outfit
    // ========================================================================
    console.log(`${colors.bright}Test Suite 4: Update Outfit${colors.reset}`);
    
    if (createdOutfitId) {
      const updatePayload = {
        metadata: {
          name: 'Updated Test Outfit',
          description: 'Updated description',
          tags: ['casual', 'updated'],
          season: ['summer', 'autumn'],
        },
      };

      const { response: updateRes, data: updateData } = await apiRequest(
        'PATCH',
        `/outfits/${createdOutfitId}`,
        token,
        updatePayload
      );
      
      logTest(
        'PATCH /api/outfits/[id] (Update outfit)',
        updateRes.status === 200 && updateData.success === true,
        updateRes.status === 200
          ? `Updated: ${updateData.data.metadata?.name || 'outfit'}`
          : `Status ${updateRes.status}: ${updateData.message || 'Failed'}`
      );

      // Verify the update
      if (updateRes.status === 200) {
        const nameMatches = updateData.data.metadata?.name === 'Updated Test Outfit';
        const seasonsMatch = Array.isArray(updateData.data.metadata?.season) &&
          updateData.data.metadata.season.length === 2;
        
        logTest(
          'PATCH /api/outfits/[id] (Verify update)',
          nameMatches && seasonsMatch,
          nameMatches && seasonsMatch
            ? 'Update verified successfully'
            : 'Update data mismatch'
        );
      }
    } else {
      console.log(`${colors.yellow}⊘ Skipping PATCH test - No outfit created${colors.reset}`);
    }

    // Test with invalid data
    if (createdOutfitId) {
      const invalidUpdate = {
        metadata: {
          name: 'a'.repeat(150), // Too long
        },
      };

      const { response: invalidUpdateRes, data: invalidUpdateData } = await apiRequest(
        'PATCH',
        `/outfits/${createdOutfitId}`,
        token,
        invalidUpdate
      );
      
      logTest(
        'PATCH /api/outfits/[id] (Validation error)',
        invalidUpdateRes.status === 400 && invalidUpdateData.success === false,
        invalidUpdateRes.status === 400
          ? 'Correctly rejected invalid update'
          : `Expected 400, got ${invalidUpdateRes.status}`
      );
    }

    console.log('');

    // ========================================================================
    // TEST 5: POST /api/outfits/shuffle - Shuffle outfit
    // ========================================================================
    console.log(`${colors.bright}Test Suite 5: Shuffle Outfit${colors.reset}`);
    
    const shufflePayload = {
      configuration: '3-part',
      lockedCategories: [],
      currentCombination: {},
    };

    const { response: shuffleRes, data: shuffleData } = await apiRequest(
      'POST',
      '/outfits/shuffle',
      token,
      shufflePayload
    );
    
    logTest(
      'POST /api/outfits/shuffle (Generate random combination)',
      shuffleRes.status === 200 && shuffleData.success === true,
      shuffleRes.status === 200
        ? `Generated combination with ${Object.keys(shuffleData.data?.combination || {}).length} categories`
        : `Status ${shuffleRes.status}: ${shuffleData.message || 'Failed'}`
    );

    // Test with locked categories
    if (testTopId) {
      const lockedShufflePayload = {
        configuration: '3-part',
        lockedCategories: ['tops'],
        currentCombination: {
          tops: testTopId,
        },
      };

      const { response: lockedRes, data: lockedData } = await apiRequest(
        'POST',
        '/outfits/shuffle',
        token,
        lockedShufflePayload
      );
      
      logTest(
        'POST /api/outfits/shuffle (With locked categories)',
        lockedRes.status === 200 && lockedData.success === true,
        lockedRes.status === 200
          ? 'Generated with locked tops category'
          : `Status ${lockedRes.status}: ${lockedData.message || 'Failed'}`
      );
    }

    // Test 4-part configuration
    const fourPartPayload = {
      configuration: '4-part',
      lockedCategories: [],
    };

    const { response: fourPartRes, data: fourPartData } = await apiRequest(
      'POST',
      '/outfits/shuffle',
      token,
      fourPartPayload
    );
    
    logTest(
      'POST /api/outfits/shuffle (4-part configuration)',
      fourPartRes.status === 200 && fourPartData.success === true,
      fourPartRes.status === 200
        ? '4-part combination generated'
        : `Status ${fourPartRes.status}: ${fourPartData.message || 'Failed'}`
    );

    console.log('');

    // ========================================================================
    // TEST 6: DELETE /api/outfits/[id] - Delete outfit
    // ========================================================================
    console.log(`${colors.bright}Test Suite 6: Delete Outfit${colors.reset}`);
    
    if (createdOutfitId) {
      const { response: deleteRes, data: deleteData } = await apiRequest(
        'DELETE',
        `/outfits/${createdOutfitId}`,
        token
      );
      
      logTest(
        'DELETE /api/outfits/[id] (Soft delete)',
        deleteRes.status === 200 && deleteData.success === true,
        deleteRes.status === 200
          ? `Deleted outfit: ${createdOutfitId}`
          : `Status ${deleteRes.status}: ${deleteData.message || 'Failed'}`
      );

      // Verify soft delete (should return 404 on GET)
      const { response: verifyRes } = await apiRequest(
        'GET',
        `/outfits/${createdOutfitId}`,
        token
      );
      
      logTest(
        'DELETE /api/outfits/[id] (Verify soft delete)',
        verifyRes.status === 404,
        verifyRes.status === 404
          ? 'Deleted outfit no longer accessible'
          : `Expected 404, got ${verifyRes.status}`
      );
    } else {
      console.log(`${colors.yellow}⊘ Skipping DELETE test - No outfit created${colors.reset}`);
    }

    // Test delete with invalid ID
    const { response: deleteInvalidRes, data: deleteInvalidData } = await apiRequest(
      'DELETE',
      '/outfits/000000000000000000000000',
      token
    );
    
    logTest(
      'DELETE /api/outfits/[id] (Not found handling)',
      deleteInvalidRes.status === 404 && deleteInvalidData.success === false,
      deleteInvalidRes.status === 404
        ? 'Correctly returned 404 for non-existent outfit'
        : `Expected 404, got ${deleteInvalidRes.status}`
    );

    console.log('');

  } catch (error) {
    console.error(`${colors.red}Test execution error:${colors.reset}`, error);
  }

  // ========================================================================
  // TEST SUMMARY
  // ========================================================================
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bright}Test Summary${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`Total Tests:  ${totalTests}`);
  console.log(`${colors.green}Passed:       ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed:       ${failedTests}${colors.reset}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  if (failedTests === 0) {
    console.log(`${colors.green}${colors.bright}✓ All tests passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}✗ Some tests failed. Please review the errors above.${colors.reset}\n`);
  }
}

// Run tests
runTests().catch(console.error);
