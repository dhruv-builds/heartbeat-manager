

## Persist Feature Images to Database - Implementation Plan

### Overview
Add persistent image storage for features so that attached images survive browser sessions. This requires database schema updates, storage bucket creation, and frontend changes.

---

### Phase 1: Database Schema Update

**SQL Migration:**
```sql
-- Add image_url column to features table
ALTER TABLE public.features
ADD COLUMN image_url TEXT;
```

---

### Phase 2: Create Storage Bucket

**SQL Migration:**
```sql
-- Create the feature-images bucket (public so images can be displayed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('feature-images', 'feature-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload feature images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feature-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update feature images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'feature-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete feature images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'feature-images');

-- Allow public read access for displaying images
CREATE POLICY "Public read access for feature images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'feature-images');
```

---

### Phase 3: Install uuid Package

Add the `uuid` package for generating unique filenames:
```bash
npm install uuid
npm install -D @types/uuid
```

---

### Phase 4: Update TypeScript Types

**File: `src/types/heartbeat.ts`**

Add `image_url` to both Feature interfaces:

```typescript
export interface Feature {
  id: string;
  project_id?: string;
  title: string;
  status: FeatureStatus;
  prompt: string;
  order: number;
  image_url?: string | null;  // NEW
  created_at: string;
  updated_at: string;
}

export interface DbFeature {
  id: string;
  project_id: string;
  title: string;
  status: FeatureStatus;
  prompt: string;
  order: number;
  image_url?: string | null;  // NEW
  created_at: string;
  updated_at: string;
}
```

---

### Phase 5: Create Image Upload Hook

**New File: `src/hooks/useImageUpload.ts`**

```typescript
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
```

---

### Phase 6: Update useProjects Hook

**File: `src/hooks/useProjects.ts`**

Key changes:
1. Add `image_url` to feature mapping in fetchProjects (line ~64)
2. Update `updateFeature` signature to accept `image_url` (line ~205)
3. Add `image_url` to duplicateFeature (line ~299)

---

### Phase 7: Update FeatureDetailSheet

**File: `src/components/heartbeat/FeatureDetailSheet.tsx`**

Major changes:

1. **Initialize from `feature.image_url`** - Load existing image on open
2. **Upload image immediately on attach** - No waiting for save
3. **Remove button clears DB** - Delete from storage and nullify column

Key flow:
```
User attaches image → Show preview → Upload to storage → Save URL to DB → Replace preview with URL
```

---

### Phase 8: Update useChromeMessaging

**File: `src/hooks/useChromeMessaging.ts`**

Update `copyImageToClipboard` to handle both base64 and URL images by fetching URL images first.

---

### Files Summary

| File | Action |
|------|--------|
| Database | Add `image_url` column |
| Storage | Create `feature-images` bucket with RLS |
| `package.json` | Add `uuid` dependency |
| `src/types/heartbeat.ts` | Add `image_url` to interfaces |
| `src/hooks/useImageUpload.ts` | **NEW** - Upload/delete operations |
| `src/hooks/useProjects.ts` | Include `image_url` in CRUD |
| `src/components/heartbeat/FeatureDetailSheet.tsx` | Load from DB, upload on attach |
| `src/hooks/useChromeMessaging.ts` | Handle URL images for clipboard |

---

### Confirmation Notes

- **uuid package**: Will be installed as a dependency
- **Upload on attach**: Yes, the image uploads immediately when selected/pasted and calls `onUpdate({ image_url: url })` right away - no need to click Save
- **Persistence**: Image URL stored in database survives browser restarts
- **Remove button**: Deletes from storage AND nullifies the database column

