import mongoose from 'mongoose';

const homeSectionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['about', 'featured-products']
  },
  title: { type: String, required: true },
  subtitle: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  config: {
    // For about sections
    description: { type: String },
    imageUrl: { type: String },
    features: [{ type: String }],
    buttonText: { type: String },
    buttonLink: { type: String },
    
    // For featured products
    productLimit: { type: Number, default: 4 },
    showFeatured: { type: Boolean, default: true },
    category: { type: String },
    selectedProductIds: [{ type: String }], // Specific products to show
    viewAllText: { type: String, default: 'View All' },
    viewAllLink: { type: String, default: '/products' },
    
    // For categories
    categoryIds: [{ type: String }],
    displayStyle: { type: String, enum: ['grid', 'carousel'], default: 'grid' },
  }
}, {
  timestamps: true
});

export const HomeSection = mongoose.model('HomeSection', homeSectionSchema);