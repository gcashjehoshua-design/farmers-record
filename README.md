# Farmer Records and Transactions System of Passi City

A comprehensive web application for managing farmer records, transactions, and subsidies in Passi City, Iloilo.

## 🚀 Tech Stack

| Feature | Technology | Why? |
|---------|-----------|------|
| Build Tool | **Vite** | Instant, modern build tool. create-react-app is dead. |
| UI Design | **Tailwind CSS + shadcn/ui** | No custom CSS needed. Copy-paste accessible components with amazing design. |
| Data Fetching | **TanStack Query (React Query)** | Handles Loading states, caching, and auto-refetching from API without messy useEffect. |
| Routing | **React Router v6** | Navigate between Dashboard, Farmers List, and Settings. |
| Forms | **React Hook Form + Zod** | Automatic validation. Long forms like Farmer Registration just work. |
| Charts | **Recharts** | Beautiful charts for "Transactions per Barangay" and "Subsidy Distribution". |
| Printing | **react-to-print** | Essential for gov't systems. Print Transaction Receipts cleanly. |

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui components (Button, Card, Input, Table, etc)
│   ├── Navbar.tsx       # Navigation bar
│   ├── FarmerForm.tsx   # Farmer registration form with validation
│   └── FarmersTable.tsx # Farmers data table
├── pages/               # Full pages
│   ├── Dashboard.tsx    # Analytics dashboard with charts
│   ├── FarmersList.tsx  # List and register farmers
│   └── Settings.tsx     # System configuration
├── hooks/               # Custom React hooks
│   └── useApi.ts        # React Query hooks for API calls
├── services/            # API clients
│   └── api.ts           # Axios instance + API functions
├── types/               # TypeScript types
│   └── index.ts         # Farmer, Transaction, Dashboard types
├── utils/               # Utility functions
├── lib/                 # Library configs
│   └── utils.ts         # shadcn/ui utilities
├── App.tsx              # Main app with Router setup
├── main.tsx             # React DOM entry point
└── index.css            # Tailwind directives
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Farmers-Records
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your API URL:
   ```
   VITE_API_URL=http://localhost:3000/api
   ```

### Development

**Start the development server:**
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

**Lint code:**
```bash
npm run lint
```

## 📋 Features

### 🏠 Dashboard
- **Key Metrics**: Total farmers, transactions, and subsidy distribution
- **Charts**:
  - Transactions per Barangay (Bar Chart)
  - Subsidy Distribution by Type (Pie Chart)
- Real-time data fetching with loading states

### 👨‍🌾 Farmers Management
- **List View**: Search and filter farmers by name or RSBSA number
- **Registration Form**: Add new farmers with validation
  - Required Fields: First Name, Last Name, RSBSA Number, Email, Phone
  - Optional: Barangay, Crop Type, Farm Area
  - Auto-validation with Zod schemas
- **CRUD Operations**: Edit and delete farmer records

### 💳 Transactions
- Record subsidy and loan transactions
- Transaction status tracking (pending, completed, cancelled)
- Transaction history and reports

### ⚙️ Settings
- System configuration (Municipality, Province)
- Data export and backup functions
- About section

## 🔌 API Integration

The app connects to a backend API at `VITE_API_URL`. Required endpoints:

```
GET    /api/farmers              # List all farmers
POST   /api/farmers              # Create farmer
GET    /api/farmers/:id          # Get farmer details
PUT    /api/farmers/:id          # Update farmer
DELETE /api/farmers/:id          # Delete farmer

GET    /api/transactions         # List all transactions
POST   /api/transactions         # Create transaction
GET    /api/dashboard/stats      # Get dashboard statistics
```

## 🎨 UI Components

Built with shadcn/ui, all components are:
- ✅ Accessible (A11y)
- ✅ Fully customizable
- ✅ Copy-paste components from CLI

Add more components:
```bash
npx shadcn add [component-name]
```

Available: button, input, card, table, form, dialog, dropdown-menu, pagination, etc.

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Traditional Hosting
1. Run `npm run build`
2. Upload `dist/` folder to your web server
3. Configure your backend API URL in environment variables

## 📚 Key Libraries Documentation

- [Vite Docs](https://vite.dev)
- [React Router v6](https://reactrouter.com)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Recharts](https://recharts.org)
- [react-to-print](https://github.com/MatthewHerbst/react-to-print)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Support

For issues, feature requests, or questions, please open an issue on the repository.

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Developed for**: Passi City Government

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
