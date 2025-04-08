export interface SkinToneResult {
    skinToneColor: string;
    skinToneConfidence: number;
    [key: string]: any; // Allow additional properties
}

export interface SegmentationResult {
    segmentation_status: boolean; // Indicates if segmentation was successful
    segmentedFaceUrl: string;
    skinTone?: SkinToneResult;
    error?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

/**
 * Sends the captured image to the backend for face segmentation
 * @param imageData Base64 encoded image
 * @returns Promise with segmentation result
 */

export async function segmentFace(imageData: string): Promise<SegmentationResult> {
    try {
        // Convert base64 image to Blob
        const response = await fetch(imageData);
        const blob = await response.blob();

        // Create a FormData object to send the image
        const formData = new FormData();
        formData.append('image', blob, 'captured_image.jpg');

        // Send the image to the backend API
        const apiRespose = await fetch(`${API_BASE_URL}/api/segment-face`, {
            method: 'POST',
            body: formData,
        });


        if (!apiRespose.ok) {
            const errorText = await apiRespose.text();
            throw new Error(`Error from server: ${errorText}`);
        }

        const result = await apiRespose.json();

        // Format the result for the frontend
        return {
            segmentation_status: result.segmentation_status,
            segmentedFaceUrl: `${API_BASE_URL}/segmented-faces/${result.segmented_face_path}`,
            skinTone: {
                skinToneColor: result.skin_tone_color,
                skinToneConfidence: result.skin_tone_confidence,
            },
            error: result.error || null, // Include error if present
        };
    } catch (error) {
        console.error ('API request failed: ', error);
        return {
            segmentation_status: false,
            segmentedFaceUrl: '',
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
