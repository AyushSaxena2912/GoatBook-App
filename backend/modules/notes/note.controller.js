const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');

const mapNote = (n) => ({
  id: n.id,
  farmId: n.farm_id,
  animalId: n.animal_id,
  title: n.title,
  content: n.content,
  createdAt: n.created_at,
  updatedAt: n.updated_at
});

// @desc    Fetch notes for the current farm
// @route   GET /api/notes
exports.getNotes = async (req, res) => {
  try {
    const { animalId } = req.query;
    const where = { farm_id: req.farmId };

    if (animalId) where.animal_id = animalId;

    const notes = await prisma.notes.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    res.json(notes.map(mapNote));
  } catch (err) {
    console.error('FETCH NOTES ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Create a new note
// @route   POST /api/notes
exports.addNote = async (req, res) => {
  const { title, content, animalId } = req.body;
  try {
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (animalId) {
      const animal = await prisma.animals.findFirst({
        where: { id: animalId, farm_id: req.farmId }
      });
      if (!animal) {
        return res.status(404).json({ message: 'No animal found with this ID in your farm' });
      }
    }

    const now = new Date();
    const note = await prisma.notes.create({
      data: {
        id: uuidv4(),
        farm_id: req.farmId,
        animal_id: animalId || null,
        title,
        content: content || null,
        created_by_user_id: req.user.id,
        created_at: now,
        updated_at: now
      }
    });

    res.status(201).json(mapNote(note));
  } catch (err) {
    console.error('ADD NOTE ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Update an existing note
// @route   PUT /api/notes/:id
exports.updateNote = async (req, res) => {
  const { title, content, animalId } = req.body;
  try {
    const record = await prisma.notes.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });
    if (!record) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const data = {
      updated_by_user_id: req.user.id,
      updated_at: new Date()
    };

    if (title !== undefined) {
      if (!title) {
        return res.status(400).json({ message: 'Title cannot be empty' });
      }
      data.title = title;
    }
    if (content !== undefined) data.content = content;

    if (animalId !== undefined) {
      if (animalId) {
        const animal = await prisma.animals.findFirst({
          where: { id: animalId, farm_id: req.farmId }
        });
        if (!animal) {
          return res.status(404).json({ message: 'No animal found with this ID in your farm' });
        }
      }
      data.animal_id = animalId || null;
    }

    const updated = await prisma.notes.update({
      where: { id: req.params.id },
      data
    });

    res.json(mapNote(updated));
  } catch (err) {
    console.error('UPDATE NOTE ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
exports.deleteNote = async (req, res) => {
  try {
    const record = await prisma.notes.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });
    if (!record) {
      return res.status(404).json({ message: 'Note not found' });
    }

    await prisma.notes.delete({ where: { id: req.params.id } });
    res.json({ message: 'Note removed successfully' });
  } catch (err) {
    console.error('DELETE NOTE ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
