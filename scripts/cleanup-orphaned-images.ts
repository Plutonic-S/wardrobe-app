import dbConnect from "@/lib/db/mongoose";
import Image from "@/lib/db/models/Image";
import Cloth from "@/lib/db/models/Cloth";
import { Types } from "mongoose";
import * as fs from 'fs';
import * as path from 'path';

async function cleanupOrphanedImages() {
  try {
    await dbConnect();
    console.log("✅ Connected to database");

    const userId = "68f4c2c352079f0f556ce6ba";
    const images = await Image.find({ userId: new Types.ObjectId(userId) });

    console.log(`\n📊 Checking ${images.length} images...\n`);
    
    const toDelete: string[] = [];
    
    for (const img of images) {
      // Check if thumbnail file exists
      const thumbnailPath = path.join(process.cwd(), 'public', img.thumbnailUrl);
      const exists = fs.existsSync(thumbnailPath);
      
      console.log(`Image ${img._id}:`);
      console.log(`  Thumbnail: ${img.thumbnailUrl}`);
      console.log(`  File exists: ${exists ? '✅' : '❌'}`);
      
      if (!exists) {
        toDelete.push(img._id.toString());
      }
      console.log('');
    }

    if (toDelete.length === 0) {
      console.log("✅ No orphaned images found");
      process.exit(0);
    }

    console.log(`\n🗑️  Deleting ${toDelete.length} orphaned images...`);
    
    // Delete orphaned Image documents
    const imageResult = await Image.deleteMany({
      _id: { $in: toDelete.map(id => new Types.ObjectId(id)) }
    });
    console.log(`✅ Deleted ${imageResult.deletedCount} Image documents`);

    // Delete associated Cloth documents
    const clothResult = await Cloth.deleteMany({
      imageId: { $in: toDelete.map(id => new Types.ObjectId(id)) }
    });
    console.log(`✅ Deleted ${clothResult.deletedCount} Cloth documents`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

cleanupOrphanedImages();
