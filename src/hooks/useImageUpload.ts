import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadImage = useCallback(async (
    base64Image: string,
    featureId: string
  ): Promise<string | null> => {
    setUploading(true);
    try {
      // Extract mime type and data from base64
      const matches = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!matches) {
        console.error('Invalid base64 image format');
        return null;
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const extension = mimeType.split('/')[1];

      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Generate unique filename
      const fileName = `${featureId}/${uuidv4()}.${extension}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('feature-images')
        .upload(fileName, blob, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('feature-images')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const deleteImage = useCallback(async (imageUrl: string): Promise<boolean> => {
    try {
      // Extract path from URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/feature-images\/(.+)$/);
      if (!pathMatch) return false;

      const { error } = await supabase.storage
        .from('feature-images')
        .remove([pathMatch[1]]);

      return !error;
    } catch (error) {
      console.error('Delete image failed:', error);
      return false;
    }
  }, []);

  return { uploadImage, deleteImage, uploading };
}
