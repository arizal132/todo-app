import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Update updatedAt before saving
TodoSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

export default mongoose.models.Todo || mongoose.model('Todo', TodoSchema);