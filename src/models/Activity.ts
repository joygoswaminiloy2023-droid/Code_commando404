import { Schema, models, model } from "mongoose";

// A lightweight, self-trimming feed of "X was assigned/finished Y" events for
// the live activity ticker. Polled from the client rather than pushed over a
// socket, since Vercel's serverless functions can't hold a persistent
// Socket.io connection open.
const ActivitySchema = new Schema(
  {
    kind: { type: String, enum: ["assigned", "completed"], required: true },
    taskTitle: { type: String, required: true },
    assigneeName: { type: String, required: true }
  },
  { timestamps: true }
);

export default models.Activity || model("Activity", ActivitySchema);
