# Getting Started with Scanned Data Organizer

This is a complete setup guide for the Scanned Data Organizer application.

## Prerequisites

- Node.js 18.17 or later
- npm or yarn
- A Supabase account

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd scanned-data-organizer
npm install
```

### 2. Set up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to Settings > API
3. Copy your project URL and anon key

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

In your Supabase dashboard:

1. Go to the SQL Editor
2. Copy and run the SQL from `supabase/migrations/001_initial_schema.sql`

This will create:
- `documents` table for storing file metadata
- `parsed_data` table for storing extracted data
- Row Level Security (RLS) policies
- Storage bucket for file uploads

### 5. Storage Setup

In your Supabase dashboard:
1. Go to Storage
2. The `documents` bucket should already be created by the migration
3. Verify the storage policies are in place

### 6. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features Overview

### Authentication
- Secure user sign-up and sign-in with Supabase Auth
- Session management and protected routes

### File Upload
- Drag and drop file upload
- Support for images (PNG, JPG, etc.) and PDFs
- File size validation (max 10MB)
- File type validation

### OCR Processing
- Automatic text extraction using Tesseract.js
- Intelligent data parsing and structuring
- Support for tables and key-value pairs

### Data Management
- Interactive data tables with sorting and filtering
- Search functionality across all data
- Pagination for large datasets
- Inline editing capabilities

### Export Options
- CSV export
- Excel export
- PDF export

## File Structure

```
src/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── AuthForm.tsx         # Authentication forms
│   ├── Dashboard.tsx        # Main dashboard
│   ├── DataTable.tsx        # Data table component
│   └── FileUpload.tsx       # File upload component
├── lib/
│   ├── export.ts            # Export utilities
│   ├── ocr.ts               # OCR service
│   ├── supabase.ts          # Supabase client
│   └── utils.ts             # Utility functions
├── store/
│   └── useAppStore.ts       # Zustand state management
├── types/
│   └── index.ts             # TypeScript type definitions
└── hooks/
    └── index.ts             # Custom React hooks
```

## Customization

### Adding New OCR Features
1. Extend the `OCRService` class in `src/lib/ocr.ts`
2. Add new parsing methods for specific document types
3. Update the data structure in `src/types/index.ts`

### Styling
- The app uses Tailwind CSS for styling
- Customize the design system in `tailwind.config.js`
- Global styles are in `src/app/globals.css`

### Adding New Data Export Formats
1. Extend the `ExportService` class in `src/lib/export.ts`
2. Add new export methods
3. Update the UI to include new export options

## Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify your environment variables are correct
   - Check that your Supabase project is active

2. **File Upload Fails**
   - Ensure storage policies are correctly configured
   - Check file size and type restrictions

3. **OCR Not Working**
   - Tesseract.js requires time to initialize
   - Check browser console for errors
   - Ensure the uploaded file is a valid image or PDF

4. **Build Errors**
   - Run `npm run type-check` to identify TypeScript issues
   - Ensure all dependencies are installed

### Performance Tips

- OCR processing can be CPU-intensive; consider processing files one at a time
- Use pagination for large datasets to improve table performance
- Consider implementing server-side OCR for production use

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
