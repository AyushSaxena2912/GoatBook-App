const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extracts public_id from a Cloudinary URL
 * @param {string} url - The full Cloudinary secure URL
 * @returns {string|null} - The extracted public_id or null
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    // Split by '/' and get the part after 'upload/'
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return null;
    
    // Everything after the version (v1234567) or directly after upload if no version
    // Usually: .../upload/v12345/folder/public_id.jpg
    let publicIdWithExtension = parts.slice(uploadIndex + 1).join('/');
    
    // Remove version if present (v followed by digits)
    if (publicIdWithExtension.match(/^v\d+\//)) {
        publicIdWithExtension = publicIdWithExtension.replace(/^v\d+\//, '');
    }
    
    // Remove extension
    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return publicIdWithExtension.substring(0, lastDotIndex);
    }
    
    return publicIdWithExtension;
  } catch (error) {
    console.error('Error extracting Cloudinary public_id:', error);
    return null;
  }
};

/**
 * Deletes an image from Cloudinary
 * @param {string} url - The full Cloudinary secure URL
 * @returns {Promise<object>} - Cloudinary API response
 */
const deleteImage = async (url) => {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) {
    console.log('Skipping Cloudinary deletion: Invalid or non-Cloudinary URL');
    return { result: 'skipped' };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary deletion result for ${publicId}:`, result);
    return result;
  } catch (error) {
    console.error(`Failed to delete image from Cloudinary (${publicId}):`, error);
    throw error;
  }
};

module.exports = {
  deleteImage,
  getPublicIdFromUrl
};
