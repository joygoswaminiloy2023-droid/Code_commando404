import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    title: { type: String, default: "" }, // e.g. "Frontend Developer"
    avatarColor: { type: String, default: "#5EF1C0" },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
    status: { type: String, enum: ["available", "busy"], default: "available" },
    isBlocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);
