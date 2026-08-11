import { Schema, models, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["assigned", "completed", "announcement", "message", "deadline"], required: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", default: null },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default models.Notification || model("Notification", NotificationSchema);