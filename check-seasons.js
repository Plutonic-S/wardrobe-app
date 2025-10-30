// Quick script to check season data
const mongoose = require('mongoose');

async function checkSeasons() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wardrobe-app');
    
    const Cloth = mongoose.model('Cloth', new mongoose.Schema({}, { strict: false }));
    
    const items = await Cloth.find({}).select('metadata.name metadata.season').limit(10);
    
    console.log('\n📊 Season Data Check:');
    console.log('='.repeat(50));
    
    items.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.metadata?.name || 'Unnamed'}`);
      console.log(`   Season: ${JSON.stringify(item.metadata?.season)}`);
      console.log(`   Type: ${Array.isArray(item.metadata?.season) ? 'Array' : typeof item.metadata?.season}`);
    });
    
    console.log('\n' + '='.repeat(50));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSeasons();
