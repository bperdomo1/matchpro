import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/gif',
  'text/plain',
  'text/csv',
  'application/json'
];

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only PNG, JPG, JPEG, SVG, GIF, TXT, CSV, and JSON files are allowed.'));
      return;
    }
    cb(null, true);
  }
});

// Handle file upload
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileInfo = {
      id: uuidv4(),
      name: req.file.originalname,
      url: fileUrl,
      type: req.file.mimetype,
      size: req.file.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store file info in database (we'll implement this later)

    res.json(fileInfo);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all files
router.get('/', async (req, res) => {
  try {
    // We'll implement database fetching here later
    const files = fs.readdirSync(uploadsDir).map(filename => {
      const stats = fs.statSync(path.join(uploadsDir, filename));
      return {
        id: path.parse(filename).name,
        name: filename,
        url: `/uploads/${filename}`,
        type: path.extname(filename).slice(1),
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        updatedAt: stats.mtime.toISOString(),
      };
    });
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Delete file
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const files = fs.readdirSync(uploadsDir);
    const fileToDelete = files.find(f => path.parse(f).name === id);

    if (!fileToDelete) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(path.join(uploadsDir, fileToDelete));
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;