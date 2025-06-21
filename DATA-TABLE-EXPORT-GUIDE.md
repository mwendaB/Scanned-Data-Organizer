# Data Table Export Options Guide

## Overview

The Data Table tab provides **flexible export options** - you do NOT need to export all data together. You can choose exactly what to export based on your needs.

## Export Options Available

### 1. **Quick Export (Current View)**
- **What it exports**: All currently visible data in the table
- **Format**: CSV
- **Use case**: Fast export of filtered/searched data
- **Button**: "Quick Export (CSV)"

### 2. **Selective Export (Choose Specific Records)**
- **What it exports**: Only the records you manually select
- **Format**: CSV or JSON
- **Features**:
  - Individual record selection with checkboxes
  - "Select All" / "Deselect All" options
  - Shows preview of first 10 records for selection
  - Export count display (e.g., "Export Selected (15 records)")
- **Button**: "Show Export Options" → Select records → "Export Selected"

### 3. **Advanced Export (Complete Control)**
- **What it exports**: Documents, parsed data, or both
- **Format**: CSV or JSON
- **Features**:
  - Document-level selection
  - Data record-level selection  
  - Bulk operations
  - Metadata inclusion
- **Button**: "Advanced Export" (takes you to Export tab)

## Export Formats

### CSV Format
```
Field Name,Field Value,Field Type,Confidence,Document ID,Created Date
"Invoice Number","#12345","text","0.95","doc-123","2024-01-15"
"Amount","$1,250.00","currency","0.92","doc-123","2024-01-15"
```

### JSON Format
```json
{
  "exported_at": "2024-06-21T10:30:00Z",
  "total_records": 25,
  "data": [
    {
      "id": "parsed-123",
      "field_name": "Invoice Number",
      "field_value": "#12345",
      "field_type": "text",
      "confidence": 0.95,
      "document_id": "doc-123",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

## How to Use Each Option

### For Quick Data Export:
1. Go to **Data** tab
2. Use search/filters to show only data you need
3. Click **"Quick Export (CSV)"**
4. Downloads filtered data immediately

### For Selective Export:
1. Go to **Data** tab
2. Click **"Show Export Options"**
3. Choose **CSV** or **JSON** format
4. Select individual records using checkboxes
5. Click **"Export Selected (X records)"**

### For Complex Export Needs:
1. Click **"Advanced Export"** button
2. Goes to **Export** tab with full control
3. Select documents, data records, or both
4. Choose comprehensive export options

## Best Practices

✅ **Quick Export**: For daily data pulls and filtered results
✅ **Selective Export**: For specific analysis or reporting needs  
✅ **Advanced Export**: For data migration, backups, or comprehensive reporting

## File Naming Convention

- Quick Export: `exported_data.csv`
- Selective Export: `data_export_{count}_records_{date}.csv`
- Advanced Export: `complete_export_{date}.csv`

## Summary

**You have complete flexibility!** Export options range from:
- Single record → Selected records → Filtered view → Complete dataset
- Choose the option that best fits your current need
- No requirement to export everything at once
- Multiple format options (CSV/JSON) for different use cases
