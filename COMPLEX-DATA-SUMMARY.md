# Complex Data Upload and Data Tab Summary

## How Complex Data Uploads Work

### 1. **Multi-Stage Processing Pipeline**

The project handles complex data uploads through a sophisticated pipeline:

```
File Upload → OCR Processing → Text Parsing → Database Storage → Analytics → Data Tab Display
```

### 2. **Smart Text Parsing**

The OCR service (`src/lib/ocr.ts`) intelligently processes different document types:

- **Tables**: Detects delimiters (tabs, pipes, spaces) and extracts structured data
- **Forms**: Identifies key-value pairs (Label: Value patterns)  
- **Unstructured Text**: Preserves content with context and line numbers

### 3. **Database Architecture**

Two main tables handle the complex data:

- **`documents`**: Stores file metadata, OCR text, and tags
- **`parsed_data`**: Normalized field-level data with confidence scores

### 4. **Tag System**

- Global tags applied to all uploaded files
- Individual file tags for specific categorization
- Tags flow through to analytics for reporting

## Data Tab Logic

### **Data Source**
The Data tab displays records from the `parsed_data` table, showing:
- Field Name (extracted labels)
- Field Value (corresponding data)
- Field Type (text, number, date)
- Confidence Score (OCR accuracy)
- Creation Date

### **Data Loading Process**
```typescript
// 1. Get user's documents
const userDocs = await supabase.from('documents').select('id')

// 2. Get all parsed data for those documents  
const parsedData = await supabase.from('parsed_data')
  .select('*')
  .in('document_id', docIds)
```

### **Features**
- Real-time data from Supabase
- Full-text search across all fields
- Sortable columns with TanStack Table
- CSV export functionality
- Confidence-based quality indicators

## Key Strengths

1. **Automatic Structure Detection**: Handles tables, forms, and free text
2. **Quality Tracking**: OCR confidence scores for reliability
3. **Flexible Tagging**: Both global and per-file categorization
4. **Real-time Analytics**: Immediate dashboard updates
5. **Audit Trail**: Complete processing history
6. **Export Ready**: Structured data for analysis

## Example Data Flow

**Input**: Invoice with table
```
Invoice #12345
Item    Qty    Price
Widgets  10    $50.00
Service   1    $100.00
```

**Parsed Output**:
```
field_name: "Invoice", field_value: "#12345"
field_name: "Item", field_value: "Widgets"  
field_name: "Qty", field_value: "10"
field_name: "Price", field_value: "$50.00"
// ... continues for each field
```

**Data Tab Display**: Each field becomes a searchable, sortable row with confidence scores.

The system successfully handles complex documents by breaking them into structured, queryable data that can be analyzed, exported, and used for business intelligence.
