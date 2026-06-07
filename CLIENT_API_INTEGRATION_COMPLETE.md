# Client Module API Integration - Complete Implementation

## 🎯 Overview
Successfully implemented complete file upload and API integration for the **Add Client** module, matching the same patterns used in the **Add Candidate** module.

---

## 📋 APIs Integrated

### 1. **Client Logo Upload**
- **Endpoint**: `/client/upload/logo`
- **Method**: POST
- **Type**: Multipart/Form-Data
- **Purpose**: Upload client logo immediately when selected

### 2. **Client Documents Upload**
- **Endpoint**: `/client/upload/documents`
- **Method**: POST
- **Type**: Multipart/Form-Data
- **Purpose**: Upload client documents (PAN, GST, etc.)

### 3. **Client Creation**
- **Endpoint**: `/client/create`
- **Method**: POST
- **Type**: JSON
- **Purpose**: Create new client with all details

---

## 📁 Files Modified

### 1. **src/utils/api/endpoints.ts**
Added client upload endpoints:
```typescript
CLIENTS: {
    // ... existing endpoints
    UPLOAD_LOGO: '/client/upload/logo',
    UPLOAD_DOCUMENTS: '/client/upload/documents',
}
```

### 2. **src/services/fileUploadService.ts**
Added two new methods:

#### `uploadClientLogo(file: File)`
- Uploads logo image to server
- Returns `DocumentUploadResponse` with `file_url`
- Validates image types and size

#### `uploadClientDocuments(files: File[])`
- Uploads multiple document files
- Returns array of `DocumentUploadResponse`
- Validates PDF and image formats

### 3. **src/components/pages/AddClient/AddClient.tsx**
Major changes:

#### Added Upload States:
```typescript
const [uploadStates, setUploadStates] = useState<{
    logo?: { uploading: boolean; error: string | null };
    documents?: { [key: string]: { uploading: boolean; error: string | null } };
}>({});
```

#### Added Upload Handlers:

**Logo Upload Handler:**
```typescript
const handleLogoUpload = async (file, onChange) => {
    // 1. Validate file (max 5MB, image types)
    // 2. Upload immediately via FileUploadService.uploadClientLogo()
    // 3. Store file_url in formData.logoUrl
    // 4. Update preview with uploaded URL
    // 5. Handle errors with UI feedback
}
```

**Document Upload Handler:**
```typescript
const handleDocumentUpload = async (documentIndex, file, onChange, currentDocuments) => {
    // 1. Validate file (max 10MB, PDF/images)
    // 2. Upload immediately via FileUploadService.uploadClientDocuments()
    // 3. Store file_url in documents[index].uploadedUrl
    // 4. Update upload states per document
    // 5. Handle errors with UI feedback
}
```

#### Added Client Creation Handler:
```typescript
const handleComplete = async (finalData) => {
    // Transform formData to match API structure
    const payload = {
        client_name: finalData.client_name,
        email: finalData.email,
        client_logo: finalData.logoUrl, // ← From logo upload
        // ... all other fields
        
        contacts: finalData.contacts.map(...),
        documents: finalData.documents.map(doc => ({
            document_type: doc.type,
            document_no: doc.number,
            document_issue_date: doc.issueDate,
            document_expiry_date: doc.expiryDate,
            client_document_file: doc.uploadedUrl // ← From document upload
        })),
        contracts: finalData.contracts.map(...),
        billing_address: {...},
        shipping_address: {...}
    };

    // POST to /client/create
    await apiCall(API_ENDPOINTS.CLIENTS.CREATE, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}
```

#### Updated Initial Form Data:
Added fields for file uploads:
```typescript
const initialFormData = {
    // Business Step
    client_name: '',
    email: '',
    // ... other fields
    
    // Logo fields
    logo: null,
    logoPreview: '',
    logoUrl: null, // ← Stored after upload
    
    // Documents with upload URLs
    documents: [{
        type: '',
        number: '',
        issueDate: '',
        expiryDate: '',
        file: null,
        uploadedUrl: null // ← Stored after upload
    }],
    
    // Contacts, contracts, addresses...
};
```

### 4. **src/components/pages/AddClient/BusinessStep.tsx**

#### Added Props:
```typescript
const BusinessStep = ({ 
    formData, 
    onChange, 
    errors, 
    touched, 
    onFileUpload,    // ← New
    uploadStates     // ← New
}: any) => {
```

#### Added Logo Upload Field:
```typescript
{/* Client Logo Upload */}
<div>
    <label>Client Logo</label>
    <input
        type="file"
        accept="image/*"
        onChange={e => {
            const file = e.target.files?.[0] || null;
            if (onFileUpload?.logo) {
                onFileUpload.logo(file, onChange);
            }
        }}
    />
    {uploadStates?.logo?.uploading && (
        <span className="text-blue-600">Uploading logo...</span>
    )}
    {uploadStates?.logo?.error && (
        <span className="text-red-500">{uploadStates.logo.error}</span>
    )}
    {formData.logoPreview && (
        <img 
            src={formData.logoPreview} 
            alt="Logo preview" 
            className="h-20 w-20 object-contain"
        />
    )}
</div>
```

### 5. **src/components/pages/AddClient/DocumentsStep.tsx**

#### Updated Interface:
```typescript
interface Document {
    type: string;
    number: string;
    issueDate: string;
    expiryDate: string;
    file: File | null;
    uploadedUrl?: string | null; // ← Added
}

interface DocumentsStepProps {
    formData: { documents: Document[] };
    onChange: (field: string, value: any) => void;
    errors?: Record<string, string>;
    onFileUpload?: { // ← Added
        documents?: (documentIndex, file, onChange, currentDocuments) => void;
    };
    uploadStates?: { // ← Added
        documents?: { [key: string]: { uploading: boolean; error: string | null } };
    };
}
```

#### Updated File Input:
```typescript
<input
    type="file"
    accept=".pdf,.jpg,.jpeg,.png"
    onChange={e => {
        const file = e.target.files?.[0] || null;
        if (file && onFileUpload?.documents) {
            // Trigger immediate upload
            onFileUpload.documents(idx, file, onChange, documents);
        } else {
            // Fallback: Just store the file
            handleFieldChange(idx, 'file', file);
        }
    }}
/>
{uploadStates?.documents?.[`doc_${idx}`]?.uploading && (
    <span className="text-blue-600">Uploading document...</span>
)}
{uploadStates?.documents?.[`doc_${idx}`]?.error && (
    <span className="text-red-500">
        {uploadStates.documents[`doc_${idx}`].error}
    </span>
)}
{doc.file && doc.uploadedUrl && (
    <span className="text-green-600">✓ Uploaded successfully</span>
)}
```

---

## 🔄 Complete Flow

### Step 1: User Interaction
1. User navigates to **Add Client** page
2. User fills in Business Step form
3. User selects **logo image** file

### Step 2: Logo Upload (Immediate)
1. `onChange` event triggers in BusinessStep
2. Calls `onFileUpload.logo(file, onChange)`
3. **AddClient.tsx** `handleLogoUpload()` executes:
   - Sets `uploadStates.logo.uploading = true`
   - Validates file (size, type)
   - Calls `FileUploadService.uploadClientLogo(file)`
   - API POST to `/client/upload/logo`
   - Server returns `{ file_url: "https://..." }`
   - Stores `file_url` in `formData.logoUrl`
   - Updates preview with uploaded URL
   - Sets `uploadStates.logo.uploading = false`

### Step 3: Document Upload (Immediate per Document)
1. User navigates to Documents Step
2. User fills document details and selects file
3. `onChange` triggers in DocumentsStep
4. Calls `onFileUpload.documents(idx, file, onChange, documents)`
5. **AddClient.tsx** `handleDocumentUpload()` executes:
   - Sets `uploadStates.documents['doc_0'].uploading = true`
   - Validates file
   - Calls `FileUploadService.uploadClientDocuments([file])`
   - API POST to `/client/upload/documents`
   - Server returns `[{ file_url: "https://..." }]`
   - Updates `documents[idx].uploadedUrl` with `file_url`
   - Sets uploading state to false

### Step 4: Client Creation (Final Submit)
1. User completes all steps and clicks **Submit**
2. `handleComplete(finalData)` executes in AddClient.tsx
3. Transforms form data to API payload:
   ```json
   {
       "client_name": "TechNova Solutions",
       "email": "support@technova.com",
       "client_logo": "https://uploaded-logo-url.png",
       "documents": [
           {
               "document_type": "PAN Card",
               "document_no": "ABCDE1234F",
               "client_document_file": "https://uploaded-doc-url.pdf"
           }
       ],
       "contacts": [...],
       "contracts": [...]
   }
   ```
4. POST to `/client/create` with full payload
5. Server creates client record with references to uploaded files
6. Success: Clear draft, navigate to `/clients`
7. Error: Show error message, keep data for retry

---

## 🎨 UX Features

### Logo Upload
- ✅ **Immediate validation** (file type, size)
- ✅ **Upload progress indicator** ("Uploading logo...")
- ✅ **Error display** (red text with error message)
- ✅ **Preview after upload** (20x20 image thumbnail)
- ✅ **Pre-filled on submit** (URL automatically included in API call)

### Document Upload
- ✅ **Per-document upload tracking** (separate states for each doc)
- ✅ **Upload progress per document** ("Uploading document...")
- ✅ **Error handling per document** (doesn't block other docs)
- ✅ **Success indicator** (green checkmark "✓ Uploaded successfully")
- ✅ **URLs auto-stored** (ready for API submission)

### Form Submission
- ✅ **No re-upload needed** (files already on server)
- ✅ **Only URLs sent in JSON** (lightweight payload)
- ✅ **Draft preservation** (localStorage backup)
- ✅ **Error recovery** (retry without re-uploading files)

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│  User Selects   │
│   Logo File     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│   BusinessStep.tsx          │
│   onChange triggered        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   AddClient.tsx             │
│   handleLogoUpload()        │
│   - Validate file           │
│   - Set uploading=true      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   FileUploadService         │
│   uploadClientLogo(file)    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   API: /client/upload/logo  │
│   Returns: { file_url }     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   AddClient.tsx             │
│   - Store file_url          │
│   - Update preview          │
│   - Set uploading=false     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   BusinessStep.tsx          │
│   - Show preview image      │
│   - formData.logoUrl set    │
└─────────────────────────────┘

[Same flow for documents, then...]

┌─────────────────────────────┐
│   User clicks Submit        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   AddClient.tsx             │
│   handleComplete(formData)  │
│   - Transform to API format │
│   - Include uploaded URLs   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   API: /client/create       │
│   Body: {                   │
│     client_logo: url,       │
│     documents: [{           │
│       client_document_file  │
│     }]                      │
│   }                         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   Success!                  │
│   - Navigate to /clients    │
│   - Clear draft             │
└─────────────────────────────┘
```

---

## ✅ Testing Checklist

### Logo Upload
- [ ] Select valid image file (PNG, JPG, etc.)
- [ ] Verify "Uploading logo..." appears
- [ ] Verify preview shows after upload
- [ ] Try uploading oversized file (> 5MB) - should show error
- [ ] Try uploading invalid file type (PDF) - should show error
- [ ] Remove file and select new one - should replace

### Document Upload
- [ ] Upload PDF document
- [ ] Upload image document (JPG/PNG)
- [ ] Verify "Uploading document..." appears
- [ ] Verify "✓ Uploaded successfully" appears after upload
- [ ] Upload multiple documents (different types)
- [ ] Try uploading oversized file (> 10MB) - should show error
- [ ] Verify each document tracks independently

### Client Creation
- [ ] Fill all required fields
- [ ] Upload logo and documents
- [ ] Submit form
- [ ] Verify success message
- [ ] Check /clients page for new client
- [ ] Verify logo URL is correct in API response
- [ ] Verify document URLs are correct in API response

### Error Scenarios
- [ ] Network error during logo upload - should show error
- [ ] Network error during document upload - should show error
- [ ] API error on client creation - should show error, keep data
- [ ] Retry after error - should work without re-uploading

### Draft Functionality
- [ ] Fill partial data
- [ ] Click "Save as Draft"
- [ ] Refresh page
- [ ] Verify draft restoration prompt
- [ ] Restore draft - uploaded files should still reference URLs
- [ ] Complete submission - should clear draft

---

## 🚀 Key Implementation Points

### 1. **Immediate Upload Pattern**
Files are uploaded **as soon as selected**, not on form submit. This:
- Provides instant feedback to users
- Reduces final submission payload size
- Allows validation before form completion
- Enables better error recovery

### 2. **URL Storage**
After upload, only **file URLs** are stored in form data:
- `formData.logoUrl` - Logo file URL
- `documents[i].uploadedUrl` - Document file URL

These URLs are then sent in the final JSON payload to `/client/create`.

### 3. **Upload State Management**
Separate state tracking for each upload:
- `uploadStates.logo` - Logo upload status
- `uploadStates.documents['doc_0']` - First document status
- `uploadStates.documents['doc_1']` - Second document status

This allows:
- Independent progress tracking
- Per-upload error handling
- Better UX with specific feedback

### 4. **Error Handling**
Three levels of error handling:
1. **Client-side validation** - File size, type
2. **Upload errors** - Network, server issues
3. **API errors** - Client creation failures

All errors are:
- Caught and logged
- Displayed to user
- Recoverable (can retry)

### 5. **Data Transformation**
Form data structure differs from API structure:
- **Form**: Nested objects, camelCase
- **API**: Flat objects, snake_case

The `handleComplete` function transforms:
```typescript
{
  // Form structure
  documents: [{
    type: "PAN Card",
    number: "ABCDE1234F",
    issueDate: "2024-01-01",
    uploadedUrl: "https://..."
  }]
}

// Transformed to API structure
{
  documents: [{
    document_type: "PAN Card",
    document_no: "ABCDE1234F",
    document_issue_date: "2024-01-01",
    client_document_file: "https://..."
  }]
}
```

---

## 📝 Summary

Successfully implemented complete file upload and API integration for the Add Client module with:

✅ **3 API endpoints** integrated  
✅ **2 new FileUploadService methods** added  
✅ **4 files modified** with upload handlers  
✅ **Immediate upload** pattern (same as Add Candidate)  
✅ **Progress tracking** and error handling  
✅ **URL storage** for efficient submission  
✅ **Complete data transformation** for API compatibility  

The implementation follows the exact same pattern as the Add Candidate module, ensuring consistency across the application!
