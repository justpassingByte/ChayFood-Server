require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const forceImport = args.includes('--force');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase());
    });
  });
}

async function importMenuItems() {
  try {
    // MongoDB connection setup
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(uri);
    
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB successfully.');
    
    // Set DB name (use 'chayfood' as default if not specified in the connection string)
    const dbName = process.env.DB_NAME || 'chayfood';
    const db = client.db(dbName);
    const menuItemsCollection = db.collection('menuitems');
    
    // Read sample data
    const sampleDataPath = path.join(__dirname, 'sample_menu_items.json');
    console.log(`Reading sample data from ${sampleDataPath}...`);
    
    if (!fs.existsSync(sampleDataPath)) {
      throw new Error('Sample data file not found. Make sure sample_menu_items.json exists in the project root.');
    }
    
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
    console.log(`Found ${sampleData.length} menu items in the sample data.`);
    
    // Check if any menu items already exist
    const existingCount = await menuItemsCollection.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing menu items in the database.`);
      
      // If not using --force flag, ask for confirmation
      if (!forceImport) {
        const answer = await askQuestion('Continue with import? This will add more items. (y/n): ');
        if (answer !== 'y') {
          console.log('Import cancelled.');
          rl.close();
          await client.close();
          return;
        }
      } else {
        console.log('--force flag detected. Proceeding with import without confirmation.');
      }
    }
    
    // Insert menu items
    console.log('Importing menu items...');
    const result = await menuItemsCollection.insertMany(sampleData);
    
    console.log(`Successfully imported ${result.insertedCount} menu items.`);
    console.log('Imported menu item IDs:');
    Object.values(result.insertedIds).forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
    
    rl.close();
    await client.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error during import:', error);
    rl.close();
    process.exit(1);
  }
}

importMenuItems(); 