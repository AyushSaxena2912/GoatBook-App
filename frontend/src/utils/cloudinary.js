import { Platform } from 'react-native';

/**
 * Uploads an image to Cloudinary using unsigned upload preset.
 * Handles platform differences (Web vs Mobile) and Android URI formatting.
 * 
 * @param {string} imageUri - Local URI of the image to upload.
 * @returns {Promise<string>} - The secure URL of the uploaded image.
 */
export const uploadToCloudinary = async (imageUri) => {
  if (!imageUri || imageUri.startsWith('http')) return imageUri;

  const CLOUD_NAME = 'dvtfv9vvr';
  const UPLOAD_PRESET = 'goatbook_preset';

  try {
    const data = new FormData();
    data.append('upload_preset', UPLOAD_PRESET);
    data.append('cloud_name', CLOUD_NAME);

    if (Platform.OS === 'web') {
      const blobResponse = await fetch(imageUri);
      const blob = await blobResponse.blob();
      data.append('file', blob, 'upload.jpg');
    } else {
      // Correct formatting for React Native (iOS/Android)
      const fileName = imageUri.split('/').pop() || 'upload.jpg';
      const fileType = fileName.split('.').pop() || 'jpeg';
      
      data.append('file', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        name: fileName,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      });
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: data,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary Upload Failed:', errorText);
      throw new Error(`Upload Failed: ${response.status}`);
    }

    const resData = await response.json();
    return resData.secure_url;
  } catch (error) {
    console.error('Cloudinary Utility Error:', error);
    throw error;
  }
};
