import mongoose, { Schema } from "mongoose";

// A portfolio-style entry — separate from the task-management "Project"
// model. Anyone (admin or member) can add a project they've shipped.
const ShowcaseProjectSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    liveUrl: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

const ShowcaseProject = mongoose.models.ShowcaseProject || mongoose.model("ShowcaseProject", ShowcaseProjectSchema);
export default ShowcaseProject;
