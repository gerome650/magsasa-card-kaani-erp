# Farm Photo Upload Feature

## Overview

The farm photo upload feature allows users to upload up to 5 photos per farm during farm registration. Photos are stored in S3 and displayed in a responsive gallery with lightbox viewing capabilities.

---

## Features

### 1. Drag-and-Drop Upload
- **Drag Zone**: Large, intuitive drop zone with visual feedback
- **Click to Browse**: Hidden file input triggered by clicking the drop zone
- **Visual States**:
  - Default: Dashed border with muted colors
  - Dragging: Primary border with highlighted background
  - Uploading: Loading spinner with upload count
  - Error: Red border with error messages

### 2. File Validation
- **Supported Formats**: JPG, JPEG, PNG, WebP
- **Maximum Size**: 5MB per image
- **Maximum Count**: 5 images per farm
- **Validation Messages**:
  - Invalid file type: "Invalid file type. Please upload JPG, PNG, or WebP images."
  - File too large: "File too large. Maximum size is 5MB."
  - Too many files: "Maximum 5 images allowed. You can upload X more."

### 3. S3 Storage
- **Storage Path**: `farms/photos/{farmPrefix}-{timestamp}.{extension}`
- **Farm Prefix**: `farm-{farmId}` for existing farms, `temp` for new farms
- **Content Type**: Preserved from original file (image/jpeg, image/png, etc.)
- **Public URLs**: Returned from S3 for immediate display

### 4. Photo Gallery
- **Grid Layout**: Responsive 2-4 column grid
- **Hover Effects**: Zoom icon overlay on hover
- **Lightbox View**:
  - Full-size image display
  - Navigation arrows (← →)
  - Thumbnail strip for quick selection
  - Close button (X)
- **Empty State**: Placeholder icon with "No photos available" message

---

## User Flow

### Farm Creation (Step 2: Characteristics)

1. **Navigate to Step 2**
   - Complete Step 1 (Basic Information)
   - Click "Next" to proceed to Characteristics

2. **Upload Photos** (Optional)
   - Scroll to "Farm Photos" section
   - **Option A**: Drag and drop images onto the drop zone
   - **Option B**: Click the drop zone to browse files
   - Select up to 5 images (JPG, PNG, or WebP, max 5MB each)

3. **Monitor Upload Progress**
   - Loading spinner appears: "Uploading X image(s)..."
   - Preview thumbnails appear after successful upload
   - Error messages display if validation fails

4. **Manage Uploaded Photos**
   - Hover over thumbnail to reveal "Remove" button
   - Click "Remove" to delete unwanted photos
   - Upload additional photos (up to 5 total)

5. **Complete Registration**
   - Continue to Step 3 (Map Boundaries)
   - Submit farm registration
   - Photos are saved with farm record

### Viewing Photos (Farm Detail Page)

1. **Navigate to Farm Detail**
   - Click on a farm from the Farms list
   - Scroll to "Farm Photos" card

2. **Browse Gallery**
   - View all uploaded photos in responsive grid
   - Hover over photo to see zoom icon

3. **Lightbox View**
   - Click any photo to open full-size view
   - Use arrow buttons (← →) to navigate
   - Click thumbnail strip to jump to specific photo
   - Press ESC or click X to close

---

## Technical Implementation

### Components

#### `ImageUpload.tsx`
```typescript
interface ImageUploadProps {
  value: string[];           // Array of S3 URLs
  onChange: (urls: string[]) => void;
  maxImages?: number;        // Default: 5
  maxSizeMB?: number;        // Default: 5
  onUpload: (file: File) => Promise<string>;
}
```

**Features**:
- Drag-and-drop event handling
- File validation (type, size, count)
- Base64 encoding for upload
- Preview grid with remove buttons
- Error message display
- Upload progress indicator

#### `PhotoGallery.tsx`
```typescript
interface PhotoGalleryProps {
  photos: string[];          // Array of S3 URLs
  className?: string;
}
```

**Features**:
- Responsive grid layout (2-4 columns)
- Lightbox dialog with navigation
- Thumbnail strip for quick access
- Empty state placeholder
- Hover effects and transitions

### Backend

#### tRPC Mutation: `farms.uploadPhoto`
```typescript
input: {
  farmId?: number;           // Optional for new farms
  fileName: string;          // Original filename
  fileData: string;          // Base64 encoded image
  contentType: string;       // MIME type
}

output: {
  url: string;               // Public S3 URL
  key: string;               // S3 object key
}
```

**Process**:
1. Decode base64 to Buffer
2. Generate unique filename: `{farmPrefix}-{timestamp}.{extension}`
3. Upload to S3 via `storagePut()`
4. Return public URL and S3 key

### Database

#### Schema: `farms` table
```sql
photoUrls JSON NULL  -- Array of S3 URLs
```

**Example**:
```json
[
  "https://s3.amazonaws.com/.../farm-123-1234567890.jpg",
  "https://s3.amazonaws.com/.../farm-123-1234567891.png"
]
```

---

## Error Handling

### Client-Side Validation
- **Invalid File Type**: Toast error + error list in UI
- **File Too Large**: Toast error + error list in UI
- **Too Many Files**: Toast error + error list in UI

### Upload Failures
- **Network Error**: Toast error: "Photo upload failed: {error message}"
- **S3 Error**: Toast error with detailed message
- **Automatic Retry**: Not implemented (user must retry manually)

### Edge Cases
- **Duplicate Files**: Allowed (each gets unique timestamp)
- **Slow Connection**: Upload progress indicator shows status
- **Browser Refresh**: Uploaded photos lost if not submitted
- **Concurrent Uploads**: Handled sequentially with Promise.all

---

## Best Practices

### For Users
1. **Use High-Quality Photos**: Clear, well-lit images work best
2. **Optimize Before Upload**: Compress large images to stay under 5MB
3. **Descriptive Photos**: Include farm entrance, crops, and key features
4. **Avoid Duplicates**: Remove similar photos to save space
5. **Check Orientation**: Ensure photos are properly oriented before upload

### For Developers
1. **Validate Early**: Check file type and size before upload
2. **Show Progress**: Always display upload status to users
3. **Handle Errors Gracefully**: Provide clear, actionable error messages
4. **Optimize Storage**: Consider image compression/resizing (future)
5. **Secure URLs**: Use presigned URLs for private farms (future)

---

## Future Enhancements

### Planned Features
- [ ] **Image Compression**: Auto-resize large images before upload
- [ ] **Photo Captions**: Add descriptions to each photo
- [ ] **Photo Reordering**: Drag-and-drop to change photo order
- [ ] **Photo Deletion**: Remove photos from existing farms
- [ ] **Bulk Upload**: Upload multiple farms' photos at once
- [ ] **Photo Count Badge**: Show photo count on farm cards
- [ ] **Thumbnail Generation**: Create smaller thumbnails for faster loading
- [ ] **EXIF Data**: Extract and display photo metadata (date, location)
- [ ] **Photo Verification**: Admin approval for uploaded photos
- [ ] **Download All**: Bulk download all farm photos as ZIP

### Performance Optimizations
- [ ] Lazy loading for photo gallery
- [ ] Progressive image loading (blur-up)
- [ ] CDN integration for faster delivery
- [ ] Image format conversion (WebP for all)
- [ ] Client-side image resizing before upload

### Security Enhancements
- [ ] Virus scanning for uploaded files
- [ ] Watermarking for copyright protection
- [ ] Private photo galleries (auth required)
- [ ] Photo access logging and audit trail

---

## Troubleshooting

### "Upload failed" Error
**Cause**: Network issue or S3 service error  
**Solution**: Check internet connection and retry upload

### Photos Not Displaying
**Cause**: Invalid S3 URLs or CORS issue  
**Solution**: Verify URLs in database and check S3 bucket CORS settings

### "File too large" Error
**Cause**: Image exceeds 5MB limit  
**Solution**: Compress image using online tools or image editor

### Drag-and-Drop Not Working
**Cause**: Browser compatibility or JavaScript disabled  
**Solution**: Use click-to-browse method or update browser

### Photos Lost After Refresh
**Cause**: Form state not persisted  
**Solution**: Complete farm registration before refreshing page

---

## API Reference

### Upload Photo
```typescript
const uploadPhotoMutation = trpc.farms.uploadPhoto.useMutation();

const handleUpload = async (file: File) => {
  // Convert to base64
  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve) => {
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });

  // Upload to S3
  const { url } = await uploadPhotoMutation.mutateAsync({
    farmId: 123,              // Optional
    fileName: file.name,
    fileData: base64,
    contentType: file.type,
  });

  return url;
};
```

### Display Gallery
```tsx
import { PhotoGallery } from "@/components/PhotoGallery";

<PhotoGallery 
  photos={farm.photoUrls} 
  className="mt-4"
/>
```

---

## Support

For issues or questions about the photo upload feature:
1. Check this documentation first
2. Review error messages in browser console
3. Test with different image formats and sizes
4. Contact development team if issue persists

---

**Last Updated**: 2024-11-17  
**Version**: 1.0.0  
**Author**: MAGSASA-CARD Development Team
