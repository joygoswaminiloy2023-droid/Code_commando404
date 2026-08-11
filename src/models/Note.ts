import mongoose, { Schema } from "mongoose";

// One free-form scratchpad per user — not tied to any task or project.
const NoteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    content: { type: String, default: "" }
  },
  { timestamps: true }
);

const Note = mongoose.models.Note || mongoose.model("Note", NoteSchema);
export default Note;