# 📄 Scanned Data Organizer

A full-stack web application that transforms scanned documents into organized, searchable data using OCR technology.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-teal)
![Tesseract.js](https://img.shields.io/badge/OCR-Tesseract.js-orange)

## ✨ Features

- 🔐 **User Authentication** - Secure login with Supabase Auth
- 📁 **File Upload** - Drag & drop interface for documents and images  
- 🔍 **OCR Processing** - Extract text from scanned documents using Tesseract.js
- 📊 **Smart Data Parsing** - Convert raw text into structured tables
- 🗂️ **Interactive Tables** - Sort, filter, search, and paginate data
- 📤 **Export Options** - Download data as CSV, Excel, or PDF
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Modern UI** - Clean interface with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17+
- npm or yarn
- Supabase account

### 1. Installation
```bash
git clone <repository-url>
cd scanned-data-organizer
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

Add your Supabase credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
Run the SQL migration in your Supabase dashboard:
```sql
-- Copy and run: supabase/migrations/001_initial_schema.sql
```

### 4. Start Development
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Documentation

- **[Quick Start Guide](./QUICKSTART.md)** - Get up and running in 5 minutes
- **[Setup Instructions](./SETUP.md)** - Detailed setup and configuration
- **[Feature Overview](./FEATURES.md)** - Complete feature list and technical details

## 🏗️ Architecture

### Frontend (Next.js 14)
- **App Router** - Modern Next.js routing system
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **TanStack Table** - Advanced data table features

### Backend (Supabase)
- **PostgreSQL** - Robust database with JSON support
- **Row Level Security** - User data isolation
- **Authentication** - Built-in auth system
- **Storage** - Secure file storage
- **Real-time** - Live data updates

### OCR Pipeline
- **Tesseract.js** - Client-side text extraction
- **Smart Parsing** - Automatic table detection
- **Data Structuring** - JSON conversion for easy manipulation

## 🗂️ Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   ├── AuthForm.tsx   # Authentication forms
│   ├── Dashboard.tsx  # Main dashboard
│   ├── DataTable.tsx  # Advanced data table
│   └── FileUpload.tsx # File upload interface
├── lib/               # Utility libraries
│   ├── supabase.ts   # Database client
│   ├── ocr.ts        # OCR processing
│   ├── export.ts     # Data export utilities
│   └── utils.ts      # Helper functions
├── store/             # State management
│   └── useAppStore.ts # Zustand store
├── types/             # TypeScript definitions
│   └── index.ts       # Type definitions
└── hooks/             # Custom React hooks
    └── index.ts       # Reusable hooks
```

## 🧪 Usage Examples

### Document Processing Flow
1. **Upload** a scanned invoice, receipt, or table screenshot
2. **Wait** for OCR processing to extract text
3. **View** structured data in the interactive table
4. **Filter** and search through extracted information
5. **Export** data for further processing

### Supported Document Types
- 📄 Invoices and receipts
- 📊 Tables and spreadsheets
- 📋 Forms and questionnaires
- 📸 Screenshots with text
- 🖼️ Any image with readable text

## 🔧 Development

### Available Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run type-check # Run TypeScript checker
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🌟 Advanced Features

### OCR Capabilities
- **Multi-language support** (currently English)
- **Table detection** and structure preservation
- **Key-value pair extraction** from forms
- **Confidence scoring** for accuracy assessment

### Data Management
- **Real-time updates** across sessions
- **User isolation** with Row Level Security
- **Version tracking** for document history
- **Tagging system** for organization

### Export Options
- **CSV** - Comma-separated values
- **Excel** - Full spreadsheet with formatting
- **PDF** - Printable reports
- **JSON** - Raw structured data

## 🚢 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy automatically

### Other Platforms
- Netlify
- Railway
- AWS Amplify
- Digital Ocean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- 📚 Check the [documentation](./SETUP.md) for detailed setup instructions
- 🐛 [Report bugs](../../issues) via GitHub Issues
- 💡 [Request features](../../issues) for new functionality
- 💬 Join discussions in [GitHub Discussions](../../discussions)

## 🔮 Roadmap

- [ ] **AI-Enhanced Classification** - Automatic document categorization
- [ ] **Collaborative Workspaces** - Team-based document processing
- [ ] **API Integration** - Connect with external services
- [ ] **Mobile App** - Native iOS/Android applications
- [ ] **Advanced Analytics** - Data visualization and insights
- [ ] **Workflow Automation** - Custom processing pipelines

---

**Built with ❤️ using Next.js, Supabase, and modern web technologies.**
