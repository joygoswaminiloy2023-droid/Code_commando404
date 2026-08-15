import mongoose, { Schema } from "mongoose";

// A private thread between one member and the admin team. `user` identifies
// whose thread this is (always the non-admin party); `sender` is whoever
// actually wrote this particular message (the member, or an admin replying).
// Other members never see this — only the thread's own user, and admins.
const MessageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    readByAdmin: { type: Boolean, default: false },
    readByUser: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;
