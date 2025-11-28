// MongoDB Aggregation Pipelines for Analytics

import mongoose from 'mongoose';
import type {
  OutfitWearData,
  ItemUsageData,
  CategoryUtilization,
  ColorData,
  ItemCPWData,
} from '@/features/analytics/types/analytics.types';

/**
 * Get outfit wear frequency statistics
 * @param userId - User ID
 * @param timeRange - Optional date range filter
 * @param limit - Number of results to return
 * @returns Array of outfit wear data
 */
export async function getOutfitWearFrequency(
  userId: string,
  timeRange?: { startDate: Date | null; endDate: Date },
  limit: number = 10
): Promise<OutfitWearData[]> {
  const Outfit = mongoose.models.Outfit;

  const matchStage: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    status: 'active',
  };

  // Add time range filter if provided
  if (timeRange?.startDate) {
    matchStage.createdAt = {
      $gte: timeRange.startDate,
      $lte: timeRange.endDate,
    };
  }

  const result = await Outfit.aggregate([
    { $match: matchStage },
    {
      $project: {
        name: '$metadata.name',
        wearCount: '$usage.wearCount',
        lastWorn: '$usage.lastWornDate',
        favorite: '$usage.favorite',
        mode: 1,
        previewImageUrl: '$previewImage.url',
      },
    },
    { $sort: { wearCount: -1 } },
    { $limit: limit },
  ]);

  return result.map((item) => ({
    outfitId: item._id.toString(),
    name: item.name || 'Untitled Outfit',
    wearCount: item.wearCount || 0,
    lastWorn: item.lastWorn ? item.lastWorn.toISOString() : null,
    favorite: item.favorite || false,
    mode: item.mode,
    previewImageUrl: item.previewImageUrl,
  }));
}

/**
 * Get least worn outfits
 * @param userId - User ID
 * @param limit - Number of results to return
 * @returns Array of outfit wear data
 */
export async function getLeastWornOutfits(
  userId: string,
  limit: number = 10
): Promise<OutfitWearData[]> {
  const Outfit = mongoose.models.Outfit;

  const result = await Outfit.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
      },
    },
    {
      $project: {
        name: '$metadata.name',
        wearCount: '$usage.wearCount',
        lastWorn: '$usage.lastWornDate',
        favorite: '$usage.favorite',
        mode: 1,
        previewImageUrl: '$previewImage.url',
      },
    },
    { $sort: { wearCount: 1 } },
    { $limit: limit },
  ]);

  return result.map((item) => ({
    outfitId: item._id.toString(),
    name: item.name || 'Untitled Outfit',
    wearCount: item.wearCount || 0,
    lastWorn: item.lastWorn ? item.lastWorn.toISOString() : null,
    favorite: item.favorite || false,
    mode: item.mode,
    previewImageUrl: item.previewImageUrl,
  }));
}

/**
 * Get style type distribution
 */
export async function getStyleTypeDistribution(userId: string) {
  const Outfit = mongoose.models.Outfit;

  const result = await Outfit.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
      },
    },
    {
      $facet: {
        byMode: [
          {
            $group: {
              _id: '$mode',
              count: { $sum: 1 },
            },
          },
        ],
        byConfig: [
          {
            $match: { mode: 'dress-me' },
          },
          {
            $group: {
              _id: '$combination.configuration',
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const modeData = result[0]?.byMode || [];
  const configData = result[0]?.byConfig || [];

  const dressMe = modeData.find((m: { _id: string; count: number }) => m._id === 'dress-me')?.count || 0;
  const canvas = modeData.find((m: { _id: string; count: number }) => m._id === 'canvas')?.count || 0;

  const configBreakdown = {
    '2-part': configData.find((c: { _id: string; count: number }) => c._id === '2-part')?.count || 0,
    '3-part': configData.find((c: { _id: string; count: number }) => c._id === '3-part')?.count || 0,
    '4-part': configData.find((c: { _id: string; count: number }) => c._id === '4-part')?.count || 0,
  };

  return {
    dressMe,
    canvas,
    total: dressMe + canvas,
    configBreakdown,
  };
}

/**
 * Get most used clothing items across all outfits
 * @param userId - User ID
 * @param limit - Number of items to return
 * @returns Array of item usage data
 */
export async function getMostUsedItems(
  userId: string,
  limit: number = 20
): Promise<ItemUsageData[]> {
  const Cloth = mongoose.models.Cloth;

  // Read directly from Cloth collection using usage.wearCount
  const result = await Cloth.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
        'usage.wearCount': { $gt: 0 }, // Only items that have been worn
      },
    },
    { $sort: { 'usage.wearCount': -1 } }, // Sort by wear count descending
    { $limit: limit },
    {
      $lookup: {
        from: 'images',
        localField: 'imageId',
        foreignField: '_id',
        as: 'imageData',
      },
    },
    { $unwind: { path: '$imageData', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        itemId: '$_id',
        name: '$metadata.name',
        category: '$metadata.category',
        usageCount: '$usage.wearCount',
        lastUsed: '$usage.lastWornDate',
        imageUrl: '$imageData.optimizedUrl',
        thumbnailUrl: '$imageData.thumbnailUrl',
      },
    },
  ]);

  return result.map((item) => ({
    itemId: item.itemId.toString(),
    name: item.name || 'Untitled Item',
    category: item.category || 'uncategorized',
    usageCount: item.usageCount || 0,
    lastUsed: item.lastUsed ? item.lastUsed.toISOString() : null,
    imageUrl: item.imageUrl,
    thumbnailUrl: item.thumbnailUrl,
  }));
}

/**
 * Get items that have never been used in any outfit
 * @param userId - User ID
 * @returns Array of unused items
 */
export async function getUnusedItems(userId: string): Promise<ItemUsageData[]> {
  const Cloth = mongoose.models.Cloth;

  // Simply get items with wearCount of 0 or undefined
  const result = await Cloth.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
        $or: [
          { 'usage.wearCount': { $exists: false } },
          { 'usage.wearCount': 0 },
        ],
      },
    },
    {
      $lookup: {
        from: 'images',
        localField: 'imageId',
        foreignField: '_id',
        as: 'imageData',
      },
    },
    { $unwind: { path: '$imageData', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        itemId: '$_id',
        name: '$metadata.name',
        category: '$metadata.category',
        addedDate: '$createdAt',
        imageUrl: '$imageData.optimizedUrl',
        thumbnailUrl: '$imageData.thumbnailUrl',
      },
    },
    { $sort: { addedDate: -1 } },
  ]);

  return result.map((item) => ({
    itemId: item.itemId.toString(),
    name: item.name || 'Untitled Item',
    category: item.category || 'uncategorized',
    usageCount: 0,
    lastUsed: null,
    imageUrl: item.imageUrl,
    thumbnailUrl: item.thumbnailUrl,
  }));
}

/**
 * Get category utilization statistics
 * @param userId - User ID
 * @returns Array of category utilization data
 */
export async function getCategoryUtilization(
  userId: string
): Promise<CategoryUtilization[]> {
  const Cloth = mongoose.models.Cloth;
  const Outfit = mongoose.models.Outfit;

  console.log('[getCategoryUtilization] Starting for user:', userId);

  // Debug: Check outfit count
  const outfitCount = await Outfit.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    status: 'active',
  });
  console.log('[getCategoryUtilization] Total active outfits:', outfitCount);

  // Get total items per category
  const totalByCategory = await Cloth.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
      },
    },
    {
      $group: {
        _id: '$metadata.category',
        totalItems: { $sum: 1 },
      },
    },
  ]);

  console.log('[getCategoryUtilization] Total by category:', totalByCategory);

  // Get usage data directly from Cloth items (much simpler and more accurate!)
  const usageResult = await Cloth.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
        'usage.wearCount': { $gt: 0 }, // Only items that have been worn
      },
    },
    {
      $group: {
        _id: { $ifNull: ['$metadata.category', 'uncategorized'] },
        uniqueItems: { $addToSet: '$_id' },
        totalUses: { $sum: '$usage.wearCount' },
      },
    },
  ]);

  console.log('[getCategoryUtilization] Usage result:', JSON.stringify(usageResult, null, 2));

  // Create lookup map for used items by category
  const usedByCategory = usageResult.reduce((acc, item) => {
    const category = item._id || 'uncategorized';
    acc[category] = {
      uniqueItems: item.uniqueItems?.length || 0,
      totalUses: item.totalUses || 0,
    };
    return acc;
  }, {} as Record<string, { uniqueItems: number; totalUses: number }>);

  console.log('[getCategoryUtilization] Used by category map:', JSON.stringify(usedByCategory, null, 2));

  // Combine data
  const utilization: CategoryUtilization[] = totalByCategory.map((cat) => {
    const category = cat._id || 'uncategorized';
    const totalItems = cat.totalItems;
    const usedData = usedByCategory[category];
    const usedItems = usedData ? usedData.uniqueItems : 0;
    const totalUses = usedData ? usedData.totalUses : 0;

    const result = {
      category,
      totalItems,
      usedItems,
      utilizationRate: totalItems > 0 ? (usedItems / totalItems) * 100 : 0,
      averageUsesPerItem: usedItems > 0 ? totalUses / usedItems : 0,
    };
    
    console.log(`[getCategoryUtilization] ${category}:`, result);
    return result;
  });

  console.log('[getCategoryUtilization] Final utilization:', JSON.stringify(utilization, null, 2));
  return utilization;
}

/**
 * Get wardrobe color distribution
 * @param userId - User ID
 * @returns Array of color data
 */
export async function getWardrobeColors(userId: string): Promise<ColorData[]> {
  const Cloth = mongoose.models.Cloth;

  const result = await Cloth.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
      },
    },
    {
      $lookup: {
        from: 'images',
        localField: 'imageId',
        foreignField: '_id',
        as: 'imageData',
      },
    },
    { $unwind: '$imageData' },
    { $match: { 'imageData.dominantColor': { $exists: true, $ne: null } } },
    {
      $group: {
        _id: '$imageData.dominantColor',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const total = result.reduce((sum, item) => sum + item.count, 0);

  return result.map((item) => ({
    color: item._id,
    count: item.count,
    percentage: total > 0 ? (item.count / total) * 100 : 0,
  }));
}

/**
 * Get cost per wear statistics for all items
 * @param userId - User ID
 * @returns Array of item CPW data
 */
export async function getCostPerWearStats(
  userId: string
): Promise<ItemCPWData[]> {
  const Cloth = mongoose.models.Cloth;
  const Outfit = mongoose.models.Outfit;

  console.log('[getCostPerWearStats] Starting for user:', userId);

  // Use aggregation to get usage counts efficiently
  const usageResult = await Outfit.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
      },
    },
    {
      $facet: {
        dressMeItems: [
          { $match: { mode: 'dress-me' } },
          {
            $project: {
              items: { $objectToArray: '$combination.items' },
            },
          },
          { $unwind: '$items' },
          { $match: { 'items.v': { $exists: true, $ne: null } } },
          {
            $group: {
              _id: '$items.v',
              count: { $sum: 1 },
            },
          },
        ],
        canvasItems: [
          { $match: { mode: 'canvas' } },
          { $unwind: '$canvasState.items' },
          {
            $group: {
              _id: '$canvasState.items.clothItemId',
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
    {
      $project: {
        allItems: { $concatArrays: ['$dressMeItems', '$canvasItems'] },
      },
    },
    { $unwind: '$allItems' },
    {
      $group: {
        _id: '$allItems._id',
        usageCount: { $sum: '$allItems.count' },
      },
    },
  ]);

  console.log('[getCostPerWearStats] Usage data fetched, items:', usageResult.length);

  // Create usage map
  const usageMap = new Map(
    usageResult.map((item) => [item._id.toString(), item.usageCount])
  );

  // Get all items with prices and populate images
  const items = await Cloth.find({
    userId: new mongoose.Types.ObjectId(userId),
    status: 'active',
    'organization.price': { $exists: true, $gt: 0 },
  })
    .populate('imageId')
    .lean()
    .limit(200); // Limit to prevent crashes

  console.log('[getCostPerWearStats] Items with prices:', items.length);

  const cpwData: ItemCPWData[] = items.map((item) => {
    const itemId = String(item._id);
    const wearCount = usageMap.get(itemId) || 0;
    const price = item.organization?.price || 0;
    const costPerWear = wearCount > 0 ? price / wearCount : Infinity;

    let roi: 'excellent' | 'good' | 'fair' | 'poor' | 'unused' = 'unused';
    if (costPerWear !== Infinity) {
      if (costPerWear < 1) roi = 'excellent';
      else if (costPerWear < 5) roi = 'good';
      else if (costPerWear < 20) roi = 'fair';
      else roi = 'poor';
    }

    return {
      itemId,
      name: item.metadata?.name || 'Untitled Item',
      category: item.metadata?.category || 'uncategorized',
      price,
      wearCount,
      costPerWear,
      roi,
      imageUrl: item.imageId?.optimizedUrl,
      thumbnailUrl: item.imageId?.thumbnailUrl,
    };
  });

  console.log('[getCostPerWearStats] Completed, returning:', cpwData.length, 'items');
  return cpwData;
}
