import mongoose from 'mongoose';

const aboutSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  features: [{ type: String }],
  buttonText: { type: String, required: true },
  buttonLink: { type: String, required: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

export const AboutSection = mongoose.model('AboutSection', aboutSectionSchema);