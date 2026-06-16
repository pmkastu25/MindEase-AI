require('dotenv').config();
const mongoose = require('mongoose');
const Journal = require('./models/Journal');
const User = require('./models/User');

async function checkJournals() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindease');
  console.log('Connected to MongoDB');
  
  const journals = await Journal.find({}).sort({ createdAt: -1 }).limit(5);
  console.log(`Found ${journals.length} recent journals:`);
  for (const j of journals) {
    const u = await User.findById(j.user);
    console.log(`- Journal: "${j.text}"`);
    console.log(`  User: ${u ? `${u.name} (${u.email})` : 'Unknown'}`);
    console.log(`  User Contacts:`, u ? { parental: u.parentalContacts, other: u.otherContacts } : 'None');
  }
  
  await mongoose.connection.close();
}

checkJournals();
