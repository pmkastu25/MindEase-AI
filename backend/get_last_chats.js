require('dotenv').config();
const mongoose = require('mongoose');
const Chat = require('./models/Chat');
const User = require('./models/User');

async function checkChats() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindease');
  console.log('Connected to MongoDB');
  
  const chats = await Chat.find({}).sort({ createdAt: -1 }).limit(5);
  console.log(`Found ${chats.length} recent chats:`);
  for (const c of chats) {
    const u = await User.findById(c.user);
    console.log(`- Chat: "${c.text}" (Role: ${c.role})`);
    console.log(`  User: ${u ? `${u.name} (${u.email})` : 'Unknown'}`);
    console.log(`  User Contacts:`, u ? { parental: u.parentalContacts, other: u.otherContacts } : 'None');
  }
  
  await mongoose.connection.close();
}

checkChats();
