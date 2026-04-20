import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  registerNumber: {
    type: String,
    unique: true,
    sparse: true,
    required: function() {
      return this.role === 'student';
    },
    validate: {
      validator: function(v) {
        if (this.role === 'student') {
          return /^\d{12}$/.test(v);
        }
        return true;
      },
      message: 'Student register number must be 12 digits'
    }
  },

  staffId: {
    type: String,
    unique: true,
    sparse: true,
    required: function() {
      return this.role === 'staff';
    }
  },

  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    default: '',
  },

  role: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    required: true,
    default: 'student',
  },

  department: {
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },

  batchYear: {
    type: Number,
    required: function() {
      return this.role === 'student';
    },
  },

  dob: {
    type: Date,
    required: function() {
      return this.role === 'student';
    },
  },

  profile: {
    profilePic: {
      type: String,
      default: '/placeholder.png',
    },
    bio: {
      type: String,
      default: '',
    },
    interests: {
      type: [String],
      default: [],
    },
    designation: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },

    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' },

    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: [{
        company: String,
        role: String,
        duration: String,
        description: String,
      }],
      default: [],
    },
    education: {
      type: [{
        institution: String,
        degree: String,
        year: String,
      }],
      default: [],
    },

    // ─── NEW ACADEMIC FIELDS ────────────────────────────────
    tenthPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    twelfthPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },
    cgpaSemester: {
      type: Number,
      min: 1,
      max: 8,
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes etc.
export default mongoose.models.User || mongoose.model('User', UserSchema);