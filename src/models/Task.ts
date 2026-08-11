import { Schema, models, model } from "mongoose";

const AttachmentSchema = new Schema(
  {
    name: String,
    url: String,
    type: { type: String, enum: ["pdf", "doc", "image", "figma", "other"] }
  },
  { _id: false }
);

const TaskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // A task can go to one or more people directly, and/or to a named group
    // within the project (assigning to a group fans it out to every current
    // member of that group).
    assignees: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    groupName: { type: String, default: "" },
    deadline: { type: Date, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    attachments: [AttachmentSchema],
    figmaLink: { type: String, default: "" },
    completedAt: { type: Date, default: null },
    completedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    // Set once a deadline-approaching push/notification has gone out, so the
    // daily reminder cron never nags the same task twice.
    reminderSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default models.Task || model("Task", TaskSchema);