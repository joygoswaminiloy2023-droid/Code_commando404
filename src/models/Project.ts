import { Schema, models, model } from "mongoose";

const GroupSchema = new Schema(
  {
    name: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

const ResourceSchema = new Schema(
  {
    kind: { type: String, enum: ["file", "link"], required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "doc", "image", "figma", "other", "link"], default: "other" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["planning", "active", "on-hold", "completed"], default: "active" },
    color: { type: String, default: "#E8342B" },
    // Optional per-project WhatsApp group invite link, set by the admin.
    whatsappLink: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    groups: [GroupSchema],
    resources: [ResourceSchema]
  },
  { timestamps: true }
);

export default models.Project || model("Project", ProjectSchema);
