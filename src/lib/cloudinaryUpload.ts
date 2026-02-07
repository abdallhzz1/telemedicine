const CLOUD_NAME = 'dkbowonww';
const UPLOAD_PRESET = 'telemedicine';

export interface CloudinaryResponse {
    secureUrl: string;
    publicId: string;
    resourceType: 'image' | 'raw';
    format: string;
    bytes: number;
    originalFilename: string;
}

export async function uploadToCloudinary(
    file: File,
    options: { folder?: string } = {}
): Promise<CloudinaryResponse> {
    const isImage = file.type.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    if (options.folder) {
        formData.append('folder', options.folder);
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        const data = await response.json();

        return {
            secureUrl: data.secure_url,
            publicId: data.public_id,
            resourceType: resourceType as 'image' | 'raw',
            format: data.format,
            bytes: data.bytes,
            originalFilename: data.original_filename,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
}
