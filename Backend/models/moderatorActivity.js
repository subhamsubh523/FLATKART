import mongoose from "mongoose";

const moderatorActivitySchema = new mongoose.Schema({
  moderatorId: { type: mongoose.Schema.Types.ObjectId, ref: "Moderator", required: true },
  moderatorName: String,
  action: String, // e.g., "blocked_owner", "deleted_flat", "updated_tenant"
  targetType: String, // "owner", "tenant", "flat", "booking"
  targetId: String,
  targetName: String,
  details: String,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("ModeratorActivity", moderatorActivitySchema);
