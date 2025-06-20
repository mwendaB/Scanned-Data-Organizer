# 🚀 Quick Start Guide

## Immediate Setup (5 minutes)

### 1. Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup
Copy and run this SQL in your Supabase SQL Editor:

```sql
-- Copy contents from supabase/migrations/001_initial_schema.sql
```

### 4. Start Development
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🧪 Testing the Application

### Authentication Flow
1. Visit the app - you'll see the login form
2. Click "Don't have an account? Sign up"
3. Create a new account with your email
4. Check your email for verification
5. Return to the app and sign in

### File Upload & OCR
1. Go to the "Upload" tab
2. Drag and drop an image with text (try a screenshot of a table or document)
3. Watch the processing indicator
4. Navigate to "Data" tab to see extracted information

### Data Management
1. Use the search box to filter data
2. Click column headers to sort
3. Use pagination controls for large datasets
4. Click "Export" to download data as CSV

## 📁 Sample Test Files

Create these simple test files to verify OCR functionality:

### Text Document (save as image):
```
Invoice #12345
Date: 2024-01-15
Amount: $199.99
Customer: John Doe
Email: john@example.com
```

### Simple Table (save as image):
```
Name        Age    City
Alice       25     New York
Bob         30     Los Angeles
Charlie     35     Chicago
```

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## 🔧 Customization Quick Tips

### Adding New OCR Features
Edit `src/lib/ocr.ts` - the `parseTextToStructuredData` method

### Changing UI Theme
Edit `src/app/globals.css` - update CSS custom properties

### Adding Export Formats
Edit `src/lib/export.ts` - add new methods to `ExportService`

### Custom Data Fields
Edit `src/types/index.ts` - update interfaces

## 🐛 Common Issues & Solutions

**"Module not found" errors:**
```bash
npm install
```

**OCR not working:**
- Ensure image has clear, readable text
- Try JPG format if PNG doesn't work
- Check browser console for errors

**Database connection errors:**
- Verify `.env.local` has correct Supabase credentials
- Check Supabase project status
- Ensure database migrations were run

**File upload fails:**
- Check file size (max 10MB)
- Verify file type (images/PDFs only)
- Check Supabase storage policies

## 📊 Demo Data

The app works best with documents containing:
- **Tables**: Spreadsheet-like data
- **Forms**: Key-value pairs
- **Invoices**: Structured business documents
- **Screenshots**: Text from applications

## 🌟 Production Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
```

## 📈 Next Steps

1. **Set up Supabase project** - Essential for full functionality
2. **Upload test documents** - Verify OCR pipeline
3. **Customize for your use case** - Modify parsing logic
4. **Deploy to production** - Share with users
5. **Monitor performance** - Check Supabase analytics

---

**Need help?** Check `SETUP.md` for detailed instructions or `FEATURES.md` for technical details.
