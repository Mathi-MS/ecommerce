import { Router } from 'express';
import { AboutSection } from '../db/schema/about.js';
import path from 'path';
import fs from 'fs';

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Image upload endpoint for about section
router.post('/upload', async (req, res) => {
  try {
    const { base64, filename } = req.body;
    if (!base64 || !filename) {
      return res.status(400).json({ error: 'base64 and filename required' });
    }
    
    const ext = path.extname(filename) || '.jpg';
    const name = `about-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);
    
    res.json({ url: `/uploads/${name}` });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get all about sections
router.get('/', async (req, res) => {
  try {
    const aboutSections = await AboutSection.find({ isActive: true }).sort({ order: 1 });
    res.json(aboutSections);
  } catch (error) {
    console.error('Error fetching about sections:', error);
    res.status(500).json({ error: 'Failed to fetch about sections' });
  }
});

// Get single about section by ID
router.get('/:id', async (req, res) => {
  try {
    const aboutSection = await AboutSection.findById(req.params.id);
    if (!aboutSection) {
      return res.status(404).json({ error: 'About section not found' });
    }
    res.json(aboutSection);
  } catch (error) {
    console.error('Error fetching about section:', error);
    res.status(500).json({ error: 'Failed to fetch about section' });
  }
});

// Create new about section
router.post('/', async (req, res) => {
  try {
    const { title, description, imageUrl, features, buttonText, buttonLink, order, isActive } = req.body;
    
    if (!title || !description || !imageUrl || !buttonText || !buttonLink) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!Array.isArray(features)) {
      return res.status(400).json({ error: 'Features must be an array' });
    }
    
    const aboutSection = new AboutSection({
      title,
      description,
      imageUrl,
      features,
      buttonText,
      buttonLink,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    const result = await aboutSection.save();
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating about section:', error);
    res.status(500).json({ error: 'Failed to create about section' });
  }
});

// Update about section
router.put('/:id', async (req, res) => {
  try {
    const { title, description, imageUrl, features, buttonText, buttonLink, order, isActive } = req.body;
    
    if (!title || !description || !imageUrl || !buttonText || !buttonLink) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!Array.isArray(features)) {
      return res.status(400).json({ error: 'Features must be an array' });
    }
    
    const result = await AboutSection.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        imageUrl,
        features,
        buttonText,
        buttonLink,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
      { new: true, runValidators: true }
    );
    
    if (!result) {
      return res.status(404).json({ error: 'About section not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error updating about section:', error);
    res.status(500).json({ error: 'Failed to update about section' });
  }
});

// Delete about section
router.delete('/:id', async (req, res) => {
  try {
    const result = await AboutSection.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'About section not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting about section:', error);
    res.status(500).json({ error: 'Failed to delete about section' });
  }
});

export default router;