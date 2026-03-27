import { Router } from 'express';
import { HomeSection } from '../db/schema/home-sections.js';

const router = Router();

// Reorder function to ensure sequential ordering
async function reorder() {
  const sections = await HomeSection.find().sort({ order: 1 });
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].order !== i + 1) {
      await HomeSection.findByIdAndUpdate(sections[i]._id, { order: i + 1 });
    }
  }
}

// Get all home sections
router.get('/', async (req, res) => {
  try {
    const sections = await HomeSection.find({ isActive: true }).sort({ order: 1 });
    res.json(sections);
  } catch (error) {
    console.error('Error fetching home sections:', error);
    res.status(500).json({ error: 'Failed to fetch home sections' });
  }
});

// Get single home section by ID
router.get('/:id', async (req, res) => {
  try {
    const section = await HomeSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Home section not found' });
    }
    res.json(section);
  } catch (error) {
    console.error('Error fetching home section:', error);
    res.status(500).json({ error: 'Failed to fetch home section' });
  }
});

// Create new home section
router.post('/', async (req, res) => {
  try {
    const { type, title, subtitle, order, isActive, config } = req.body;
    
    if (!type || !title) {
      return res.status(400).json({ error: 'Type and title are required' });
    }
    
    const pos = Number(order) || 1;
    
    // Shift existing sections with order >= pos
    await HomeSection.updateMany(
      { order: { $gte: pos } }, 
      { $inc: { order: 1 } }
    );
    
    const section = new HomeSection({
      type,
      title,
      subtitle,
      order: pos,
      isActive: isActive !== undefined ? isActive : true,
      config: config || {}
    });
    
    const result = await section.save();
    await reorder(); // Ensure clean sequential ordering
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating home section:', error);
    res.status(500).json({ error: 'Failed to create home section' });
  }
});

// Update home section
router.put('/:id', async (req, res) => {
  try {
    const { type, title, subtitle, order, isActive, config } = req.body;
    
    if (!type || !title) {
      return res.status(400).json({ error: 'Type and title are required' });
    }
    
    // Handle order changes
    if (order !== undefined) {
      const current = await HomeSection.findById(req.params.id);
      if (current) {
        const newPos = Number(order);
        const oldPos = current.order;
        
        if (newPos !== oldPos) {
          if (newPos < oldPos) {
            // Moving up: increment order of sections between newPos and oldPos
            await HomeSection.updateMany(
              { 
                _id: { $ne: current._id }, 
                order: { $gte: newPos, $lt: oldPos } 
              }, 
              { $inc: { order: 1 } }
            );
          } else {
            // Moving down: decrement order of sections between oldPos and newPos
            await HomeSection.updateMany(
              { 
                _id: { $ne: current._id }, 
                order: { $gt: oldPos, $lte: newPos } 
              }, 
              { $inc: { order: -1 } }
            );
          }
        }
      }
    }
    
    const result = await HomeSection.findByIdAndUpdate(
      req.params.id,
      {
        type,
        title,
        subtitle,
        order: Number(order) || 0,
        isActive: isActive !== undefined ? isActive : true,
        config: config || {}
      },
      { new: true, runValidators: true }
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Home section not found' });
    }
    
    await reorder(); // Ensure clean sequential ordering
    res.json(result);
  } catch (error) {
    console.error('Error updating home section:', error);
    res.status(500).json({ error: 'Failed to update home section' });
  }
});

// Delete home section
router.delete('/:id', async (req, res) => {
  try {
    const result = await HomeSection.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Home section not found' });
    }
    await reorder(); // Reorder remaining sections
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting home section:', error);
    res.status(500).json({ error: 'Failed to delete home section' });
  }
});

export default router;