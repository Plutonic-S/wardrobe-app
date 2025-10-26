import dbConnect from "@/lib/db/mongoose";
import Image from "@/lib/db/models/Image";
import { Types } from "mongoose";

async function checkImagePaths() {
  try {
    await dbConnect();
    console.log("✅ Connected to database");

    const userId = "68f4c2c352079f0f556ce6ba";
    const images = await Image.find({ userId: new Types.ObjectId(userId) });

    console.log(`\n📊 Found ${images.length} images:\n`);
    
    images.forEach((img, i) => {
      console.log(`Image ${i + 1}:`);
      console.log(`  ID: ${img._id}`);
      console.log(`  Original: ${img.originalUrl}`);
      console.log(`  Optimized: ${img.optimizedUrl}`);
      console.log(`  Thumbnail: ${img.thumbnailUrl}`);
      console.log(`  Status: ${img.processingStatus}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkImagePaths();
