# 🌾 Farmers Record Management System

A modern, user-friendly web application for managing farmer profiles and recording agricultural transactions. Built with Node.js, Express, and SQLite.

## Features

✅ **Farmer Management**
- Create and manage farmer profiles
- Store farmer details (name, phone, barangay, postal code)
- Track farm information (name, type, size)

✅ **Transaction Recording**
- Record various transaction types (loans, disbursements, harvests, etc.)
- Automatic timestamp with Philippines timezone (Asia/Manila)
- Transaction tracking with status updates
- Detailed notes and descriptions

✅ **User Interface**
- Large, readable fonts (22px+) optimized for elderly users
- Responsive design (360px - 1600px+ screens)
- Modern gradient design with smooth animations
- Intuitive navigation with smart back buttons
- Real-time form updates without page reload

✅ **Performance**
- Automatic navigation after successful form submission
- Instant data display on profile pages
- Clean, optimized codebase

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** SQLite3
- **Server:** localhost:3000 (development) or Railway.app (production)

## Local Installation

### Prerequisites
- Node.js 18+ 
- npm (comes with Node.js)

### Setup Steps

1. **Clone or download the project**
   ```bash
   cd FARMERS\ RECORD
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database** (runs automatically on first start)
   ```bash
   npm run init-db
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Open browser: `http://localhost:3000`

## Database

The system uses SQLite3 with a local database file:
- Database location: `backend/database/farmers_record.db`
- Auto-initializes on first run with sample data
- Tables: farmers, transaction_types, transactions

### Sample Data
The system comes with:
- 5 sample farmers
- 8 predefined transaction types
- 10 sample transactions

## Deployment on Railway

Railway is the recommended platform for deploying this application. See instructions below.

### Step-by-Step Railway Deployment

#### 1. Create GitHub Repository

```bash
# Initialize Git in your project folder
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Farmers Record System"

# Create a new repository on GitHub.com
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/farmers-record.git
git branch -M main
git push -u origin main
```

#### 2. Set Up Railway Account

1. Go to **https://railway.app**
2. Click "Start Project" → "Deploy from GitHub"
3. Authorize Railway to access your GitHub account
4. Select the `farmers-record` repository

#### 3. Configure Railway

1. Railway will detect it's a Node.js project
2. Set environment variables in Railway dashboard:
   ```
   PORT=3000
   NODE_ENV=production
   API_BASE_URL=https://YOUR_RAILWAY_DOMAIN.railway.app
   ```

3. The start command should be: `npm start`

#### 4. Deploy

Railway will automatically deploy your app. Your app will be live at your Railway domain!

#### 5. Share with Client

Copy the Railway URL and share with your client for immediate access.

## Environment Variables

Copy `.env.example` to `.env` in the root directory and fill in values.

## File Structure

Complete project organization with frontend, backend, and database files.

## API Endpoints

### Farmers
- `GET /api/farmers` - Get all farmers
- `POST /api/farmers` - Create new farmer
- `GET /api/farmers/:id` - Get farmer details
- `PUT /api/farmers/:id` - Update farmer
- `GET /api/farmers/search/:q` - Search farmers

### Transactions
- `GET /api/transactions/types` - Get transaction types
- `POST /api/transactions` - Record transaction
- `GET /api/transactions` - Get all transactions

## Design Features

- Large fonts (22px+) for accessibility
- Responsive across all screen sizes
- Modern gradient design
- Smooth animations and transitions
- High contrast for readability

## Support

For deployment help:
1. Visit [Railway Documentation](https://docs.railway.app)
2. Check environment variables are set correctly
3. Review server logs in Railway dashboard

## License

ISC

---

**Built for elderly farmers with modern design principles** 🌾
