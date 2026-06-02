// 一次性迁移：将所有现有用户从 inactive 改为 active
// 用法：docker compose run --rm backend node scripts/migrateInactiveUsers.js
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_FULL;
if (!uri) {
  console.error("MONGODB_URI not set");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
    const result = await mongoose.connection.db
      .collection("users")
      .updateMany({ status: "inactive" }, { $set: { status: "active" } });
    console.log(`Modified: ${result.modifiedCount}, Matched: ${result.matchedCount}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
})();
