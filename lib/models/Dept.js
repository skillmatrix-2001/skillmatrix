import mongoose from 'mongoose';

const DeptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
    match: /^#[0-9A-F]{6}$/i, // Hex color format
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Dept || mongoose.model('Dept', DeptSchema);