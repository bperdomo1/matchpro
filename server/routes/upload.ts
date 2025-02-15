import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@db';
import { files, type InsertFile } from '@db/schema';
import { eq, desc, inArray, sql } from 'drizzle-orm';
import { users } from '@db/schema';


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
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const baseName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9-_.]/g, '_');
    const fileName = `${baseName}-${uniqueId}${ext}`;
    cb(null, fileName);
  }
});

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/gif',
  'text/plain',
  'text/csv',
  'application/json',
  'video/mp4',
  'video/webm'
];

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only PNG, JPG, JPEG, SVG, GIF, TXT, CSV, JSON, MP4 and WEBM files are allowed.'));
      return;
    }
    cb(null, true);
  }
});

// Handle file upload
router.post('/upload', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const fileUrl = `/uploads/${req.file.filename}`;
      const fileData: InsertFile = {
        id: uuidv4(),
        name: req.file.originalname,
        url: fileUrl,
        type: req.file.mimetype,
        size: req.file.size,
        uploadedById: req.user?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store file information in database
      const [newFile] = await db.insert(files).values(fileData).returning();

      res.status(200).json(newFile);
    } catch (error) {
      // If database insertion fails, delete the uploaded file
      if (req.file) {
        fs.unlinkSync(path.join(uploadsDir, req.file.filename));
      }
      console.error('File upload error:', error);
      res.status(500).json({ 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
});

// Get all files
router.get('/', async (req, res) => {
  try {
    const allFiles = await db
      .select({
        file: files,
        uploadedBy: {
          id: users.id,
          name: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          email: users.email
        }
      })
      .from(files)
      .leftJoin(users, eq(files.uploadedById, users.id))
      .orderBy(desc(files.createdAt));

    res.json(allFiles);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Delete file
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get file information from database
    const [fileToDelete] = await db
      .select()
      .from(files)
      .where(eq(files.id, id))
      .limit(1);

    if (!fileToDelete) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Extract filename from URL
    const filename = path.basename(fileToDelete.url);
    const filePath = path.join(uploadsDir, filename);

    // Delete from filesystem first
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsError) {
      console.error('Error deleting file from filesystem:', fsError);
      // Continue with database deletion even if file system deletion fails
    }

    // Delete from database
    await db.delete(files).where(eq(files.id, id));

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Bulk actions endpoint
router.post('/bulk', async (req, res) => {
  const { action, fileIds } = req.body;

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ error: 'No files selected' });
  }

  try {
    if (action === 'delete') {
      const filesToDelete = await db
        .select()
        .from(files)
        .where(inArray(files.id, fileIds));

      for (const file of filesToDelete) {
        const filename = path.basename(file.url);
        const filePath = path.join(uploadsDir, filename);

        // Delete from filesystem
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fsError) {
          console.error(`Error deleting file ${filename} from filesystem:`, fsError);
          // Continue with next file
        }
      }

      // Delete all selected files from database
      await db.delete(files).where(inArray(files.id, fileIds));

      return res.json({ success: true, message: 'Files deleted successfully' });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ error: 'Failed to perform bulk action' });
  }
});

export default router;