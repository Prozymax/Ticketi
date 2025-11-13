const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directories exist
const eventsDir = path.join(__dirname, '../uploads/events');
const profilesDir = path.join(__dirname, '../uploads/profiles');

if (!fs.existsSync(eventsDir)) {
    fs.mkdirSync(eventsDir, { recursive: true });
}
if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
}

// Configure multer storage - using memory storage for Filestack upload
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = (fieldName) => {
    return (req, res, next) => {
        const singleUpload = upload.single(fieldName);
        
        singleUpload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Maximum size is 5MB.',
                        error: 'FILE_TOO_LARGE'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: 'File upload error: ' + err.message,
                    error: err.code
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message,
                    error: 'UPLOAD_ERROR'
                });
            }
            
            // Add file path to request if file was uploaded
            if (req.file) {
                // Store only the filename, not the full path
                req.uploadedFile = req.file.filename;
            }
            
            next();
        });
    };
};

module.exports = {
    upload,
    uploadSingle
};