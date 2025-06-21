# Complex Data Upload and Data Tab Logic Guide

## Overview

The Scanned Data Organizer handles complex data uploads through a multi-stage pipeline that processes files, extracts text using OCR, parses the text into structured data, and stores everything in a relational database with audit trails and analytics.

## Complex Data Upload Flow

### 1. File Upload Component (`FileUpload.tsx`)

The file upload process begins with the `FileUpload` component, which provides:

- **Drag & Drop Interface**: Accepts images and PDFs up to 10MB
- **Tagging System**: 
  - Global tags applied to all files
  - Individual file tags
  - Suggested tags (invoice, receipt, contract, report, etc.)
- **File Management**: Preview images, manage individual files
- **Metadata Preparation**: Each file gets a unique ID and associated tags

**Key Features:**
```typescript
interface UploadedFile extends File {
  preview?: string
  id: string
  tags?: string[]
}
```

### 2. File Processing Pipeline (`Dashboard.tsx` - `handleFilesUploaded`)

When files are uploaded, they go through this pipeline:

#### Step 1: File Storage
- Files are uploaded to Supabase Storage with user-scoped paths
- Original filename and metadata are preserved

#### Step 2: OCR Processing
- Uses Tesseract.js to extract text from images and PDFs
- Returns confidence scores and raw text

#### Step 3: Text Parsing
The `OCRService.parseTextToStructuredData()` method handles complex data parsing:

**Table Detection:**
- Detects table-like structures using delimiters (`\t`, `|`, multiple spaces)
- Extracts headers and parses rows into structured data
- Handles various table formats automatically

**Key-Value Pair Detection:**
- Identifies patterns like "Label: Value"
- Extracts field names and values

**Fallback Text Processing:**
- Treats unstructured text as content blocks
- Preserves line numbers and context

#### Step 4: Database Storage
The parsed data is stored in multiple related tables:

```sql
-- documents table
- uploaded_by: user ID
- filename: original filename  
- file_path: storage path
- mime_type: file type
- file_size: size in bytes
- ocr_text: raw OCR text
- parsed_data: JSON structure
- tags: array of tags
- workspace_id: collaborative workspace

-- parsed_data table (normalized structure)
- document_id: reference to document
- field_name: extracted field name
- field_value: extracted field value
- field_type: data type (text, number, date)
- confidence: OCR confidence score
- page_number: source page
- coordinates: position data (optional)
```

#### Step 5: Analytics and Risk Assessment
- Extracts financial data (amounts, dates)
- Calculates risk scores based on content
- Creates audit entries
- Updates analytics counters

## Data Tab Logic

### Data Structure
The Data tab displays parsed data from the `parsed_data` table with these columns:

1. **Field Name**: The extracted field/label name
2. **Field Value**: The corresponding value
3. **Type**: Data type (text, number, date, etc.)
4. **Confidence**: OCR confidence percentage
5. **Created**: When the data was processed

### Data Loading Process

```typescript
const loadUserData = async () => {
  // 1. Get all documents for the demo user
  const { data: userDocs } = await supabase
    .from('documents')
    .select('id')
    .eq('uploaded_by', demoUserId)

  // 2. Get all parsed data for those documents
  const { data } = await supabase
    .from('parsed_data')
    .select('*')
    .in('document_id', docIds)
    .order('created_at', { ascending: false })

  setParsedData(data || [])
}
```

### Data Display
- Uses TanStack Table for advanced sorting, filtering, and pagination
- Supports full-text search across all fields
- Provides CSV export functionality
- Shows real-time data from the database

## Complex Data Handling Examples

### Example 1: Invoice Processing
```
Input: "Invoice #12345
Date: 2024-01-15
Amount: $1,250.00
Client: ABC Corp"

Parsed Output:
- field_name: "Invoice", field_value: "#12345"
- field_name: "Date", field_value: "2024-01-15"  
- field_name: "Amount", field_value: "$1,250.00"
- field_name: "Client", field_value: "ABC Corp"
```

### Example 2: Table Processing
```
Input: "Name    Age    City
John    25     NYC
Jane    30     LA"

Parsed Output:
- field_name: "Name", field_value: "John"
- field_name: "Age", field_value: "25"
- field_name: "City", field_value: "NYC"
(repeated for each row)
```

### Example 3: Unstructured Text
```
Input: "This is a general document about company policies."

Parsed Output:
- field_name: "content", field_value: "This is a general document about company policies."
- field_name: "type", field_value: "text"
- field_name: "line_number", field_value: "1"
```

## Data Flow Summary

```
File Upload → Storage → OCR → Text Parsing → Database Storage → Analytics → Data Tab Display
     ↓            ↓       ↓         ↓              ↓              ↓              ↓
  File tags   Cloud URL  Raw text  Structured   Normalized    Risk scores   Searchable
  Metadata    Audit log  Confidence  objects     relations    Audit trail    Table view
```

## Key Features

1. **Automatic Structure Detection**: Intelligently detects tables, forms, and key-value pairs
2. **Confidence Tracking**: OCR confidence scores help identify potential errors
3. **Tag Propagation**: Tags flow from upload to analytics for categorization
4. **Real-time Analytics**: Processed data immediately appears in dashboards
5. **Audit Trail**: Every action is logged for compliance
6. **Export Capabilities**: Data can be exported as CSV with proper formatting
7. **Search and Filter**: Full-text search across all extracted fields
8. **Collaborative Workspaces**: Data can be shared and accessed by team members

## Technical Architecture

- **Frontend**: React with TypeScript, TanStack Table for data display
- **OCR Engine**: Tesseract.js for client-side text extraction
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Storage**: Supabase Storage for file management
- **State Management**: Zustand for application state
- **Styling**: Tailwind CSS with shadcn/ui components

This architecture ensures that complex documents are processed accurately, stored efficiently, and made available for analysis and collaboration in real-time.
