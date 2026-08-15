import mongoose, { Schema } from "mongoose";

// A scheduled meeting tied to one project. `attendees` is who gets the
// staged reminder pushes; visibility of the meeting itself extends to every
// member of the project regardless of whether they're a listed attendee.
const MeetingSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true },
    topic: { type: String, default: "" },
    scheduledAt: { type: Date, required: true },
    scheduledBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    attendees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    notes: { type: String, default: "" },
    remind48hSent: { type: Boolean, default: false },
    remind24hSent: { type: Boolean, default: false },
    remind1hSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Meeting = mongoose.models.Meeting || mongoose.model("Meeting", MeetingSchema);
export default Meeting;