import mongoose from "mongoose";

const ExperienceSchema = new mongoose.Schema({
  company    : { type: String, default: "" },
  role       : { type: String, default: "" },
  duration   : { type: String, default: "" },
  description: { type: String, default: "" },
}, { _id: false });

const EducationSchema = new mongoose.Schema({
  institution: { type: String, default: "" },
  degree     : { type: String, default: "" },
  year       : { type: String, default: "" },
}, { _id: false });

const ProfileSchema = new mongoose.Schema({
  bio        : { type: String, default: "" },
  interests  : [{ type: String }],
  designation: { type: String, default: "" },
  summary    : { type: String, default: "" },
  skills     : [{ type: String }],
  experience : [ExperienceSchema],
  education  : [EducationSchema],
}, { _id: false });

const UserProfileSchema = new mongoose.Schema({
  name          : { type: String, required: true },
  email         : { type: String, default: "" },
  registerNumber: { type: String, unique: true, sparse: true },
  staffId       : { type: String, unique: true, sparse: true },
  department    : { type: String, default: "" },
  batchYear     : { type: String, default: "" },
  role          : { type: String, enum: ["student", "staff", "admin"], default: "student" },
  profile       : { type: ProfileSchema, default: () => ({}) },
}, {
  timestamps: true,
  collection: "users",
});

const UserProfile = mongoose.models.UserProfile
  || mongoose.model("UserProfile", UserProfileSchema);

export default UserProfile;
