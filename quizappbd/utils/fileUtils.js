const fs = require('fs');
const path = require('path');

// Specify the directory where uploaded files are stored
const uploadDir = path.join(__dirname, '..', 'uploads'); 

// Function to delete uploaded files
function deleteUploadedFiles(files) {
  files.forEach((file) => {
    if (file) {
      const filePath = path.join(uploadDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Delete the file if it exists
      }
    }
  });
}

module.exports = { deleteUploadedFiles };
