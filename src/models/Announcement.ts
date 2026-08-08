import { Schema, models, model } from "mongoose";

const AnnouncementSchema = new Schema(
  {
    message: { type: String, required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export default models.Announcement || model("Announcement", AnnouncementSchema);
