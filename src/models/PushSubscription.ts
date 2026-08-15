import mongoose, { Schema } from "mongoose";

const PushSubscriptionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  },
  { timestamps: true }
);

const PushSubscription =
  mongoose.models.PushSubscription || mongoose.model("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;
