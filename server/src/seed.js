import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './config/db.js';
import Category from './models/Category.js';
import { DEFAULT_CATEGORIES } from './config/constants.js';

async function seed() {
  await connectDB();
  console.log('[seed] connected to MongoDB');

  let created = 0;
  let updated = 0;

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await Category.findOne({ userId: null, name: cat.name });
    if (existing) {
      existing.type = cat.type;
      existing.iconKey = cat.iconKey;
      existing.isDefault = true;
      existing.isActive = true;
      await existing.save();
      updated += 1;
    } else {
      await Category.create({
        name: cat.name,
        type: cat.type,
        iconKey: cat.iconKey,
        isDefault: true,
        isActive: true,
        userId: null,
      });
      created += 1;
    }
  }

  console.log(`[seed] default categories: ${created} created, ${updated} updated`);
  await disconnectDB();
  console.log('[seed] done');
}

seed().catch((err) => {
  console.error('[seed] failed:', err.message);
  mongoose.connection.close().finally(() => process.exit(1));
});
