import dbConnect from "@/lib/db/mongoose";
import Cloth from "@/lib/db/models/Cloth";
import Image from "@/lib/db/models/Image";
import { Types } from "mongoose";

/**
 * Delete all clothing items and associated images for a specific user
 */
async function deleteUserClothes(userId: string) {
  try {
    // Connect to database
    await dbConnect();
    console.log("✅ Connected to database");

    // Validate userId
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error(`Invalid userId format: ${userId}`);
    }

    const userObjectId = new Types.ObjectId(userId);

    // Find all clothing items for this user
    const clothItems = await Cloth.find({ userId: userObjectId });
    console.log(`📊 Found ${clothItems.length} clothing items for user ${userId}`);

    if (clothItems.length === 0) {
      console.log("✅ No items to delete");
      return;
    }

    // Extract imageIds
    const imageIds = clothItems.map((item) => item.imageId);
    console.log(`🖼️  Associated with ${imageIds.length} images`);

    // Delete all clothing items
    const clothDeleteResult = await Cloth.deleteMany({ userId: userObjectId });
    console.log(`🗑️  Deleted ${clothDeleteResult.deletedCount} clothing items`);

    // Delete all associated images
    const imageDeleteResult = await Image.deleteMany({
      _id: { $in: imageIds },
      userId: userObjectId,
    });
    console.log(`🗑️  Deleted ${imageDeleteResult.deletedCount} images`);

    console.log("✅ Successfully deleted all clothing items and images");
  } catch (error) {
    console.error("❌ Error deleting user clothes:", error);
    throw error;
  } finally {
    // Exit process
    process.exit(0);
  }
}

// Run the script
const userId = "68f4c2c352079f0f556ce6ba";
console.log(`🚀 Starting deletion for user: ${userId}`);
deleteUserClothes(userId);
