# MAGSASA-CARD KaAni ERP MVP

**Agricultural Management System with AI-Powered Advisory**

A comprehensive Enterprise Resource Planning (ERP) system designed for CARD MRI's agricultural cooperative, featuring farm management, harvest tracking, cost analysis, and KaAni AI chatbot powered by Google Gemini.

---

## 🌾 Features

### Core Modules
- **Farm Management**: Register farms, draw boundaries with Google Maps, track multiple parcels
- **Harvest Tracking**: Record yields, quality grades, calculate productivity metrics
- **Cost Analysis**: Track input costs, calculate ROI and profit margins
- **KaAni AI Assistant**: Bilingual (Filipino/English) agricultural advisory chatbot
- **Analytics Dashboard**: Interactive charts for harvest trends, crop distribution, regional analysis
- **Batch Orders**: Aggregate farmer orders to meet supplier MOQs
- **Supplier Portal**: Inventory management, order tracking, delivery scheduling

### Technical Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express 4 + tRPC 11
- **Database**: MySQL (Drizzle ORM)
- **AI**: Google Gemini API (via AI Studio)
- **Maps**: Google Maps JavaScript API (via Manus proxy)
- **Auth**: Demo authentication (3 roles: farmer, field_officer, manager)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22.x or higher
- pnpm 9.x or higher
- MySQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gerome650/magsasa-card-kaani-erp.git
   cd magsasa-card-kaani-erp
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   # Database
   DATABASE_URL=mysql://user:password@localhost:3306/magsasa_card

   # Google AI Studio (for KaAni chatbot)
   GOOGLE_AI_STUDIO_API_KEY=your_api_key_here

   # JWT Secret (generate a random string)
   JWT_SECRET=your_secret_key_here

   # App Configuration
   VITE_APP_TITLE=MAGSASA-CARD
   VITE_APP_LOGO=/logo.png

   # Built-in Forge API (Manus platform - optional for development)
   BUILT_IN_FORGE_API_URL=https://forge-api.manus.im
   BUILT_IN_FORGE_API_KEY=your_forge_key
   VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_key
   VITE_FRONTEND_FORGE_API_URL=https://forge-api.manus.im

   # OAuth (Manus platform - optional for development)
   OAUTH_SERVER_URL=https://oauth.manus.im
   VITE_OAUTH_PORTAL_URL=https://portal.manus.im
   VITE_APP_ID=your_app_id
   OWNER_OPEN_ID=your_owner_id
   OWNER_NAME=Your Name

   # Analytics (optional)
   VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
   VITE_ANALYTICS_WEBSITE_ID=your_website_id
   ```

4. **Set up the database**
   ```bash
   # Push schema to database
   pnpm db:push
   ```

5. **Seed sample data (optional)**
   ```bash
   node seed-farmers.mjs
   ```

6. **Start development server**
   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:3000`

---

## 🔑 Demo Accounts

The system includes three demo accounts for testing:

| Username | Password | Role | Access |
|----------|----------|------|--------|
| farmer | demo123 | Farmer | Marketplace, Orders, Harvest Entry |
| officer | demo123 | Field Officer | Farm Management, Harvest Approval |
| manager | demo123 | Manager | Analytics, Loan Approval, Full Access |

---

## 📁 Project Structure

```
magsasa-card-kaani-erp/
├── client/                    # Frontend React application
│   ├── public/               # Static assets
│   └── src/
│       ├── pages/            # Page components
│       ├── components/       # Reusable UI components
│       ├── services/         # API service layer
│       ├── hooks/            # Custom React hooks
│       ├── lib/              # Utility functions
│       └── contexts/         # React contexts
├── server/                    # Backend Express + tRPC
│   ├── _core/                # Core server infrastructure
│   ├── routers.ts            # tRPC API routes
│   ├── db.ts                 # Database query helpers
│   └── storage.ts            # S3 storage helpers
├── drizzle/                   # Database schema & migrations
│   ├── schema.ts             # Database schema definition
│   └── migrations/           # SQL migration files
├── shared/                    # Shared types & constants
│   ├── const.ts              # Shared constants
│   └── types.ts              # Shared TypeScript types
├── docs/                      # Documentation
├── scripts/                   # Utility scripts
├── package.json              # Dependencies & scripts
├── vite.config.ts            # Vite configuration
├── drizzle.config.ts         # Drizzle ORM configuration
└── tsconfig.json             # TypeScript configuration
```

---

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server (frontend + backend)
pnpm build            # Build for production
pnpm preview          # Preview production build

# Database
pnpm db:push          # Generate migrations and apply to database

# Code Quality
pnpm format           # Format code with Prettier
pnpm test             # Run tests with Vitest
```

### Database Schema

The application uses the following main tables:

- **farms**: Farm registration data, boundaries, crops
- **users**: User authentication and profiles
- **chatMessages**: KaAni AI conversation history
- **conversations**: Chat conversation metadata
- **yields**: Harvest records with quality grades
- **costs**: Input cost tracking
- **boundaries**: GeoJSON farm boundary data

---

## 🌐 API Endpoints

### tRPC Routes

The API is built with tRPC for type-safe client-server communication:

- **farms**: CRUD operations for farm management
- **boundaries**: Save/load farm boundaries (GeoJSON)
- **yields**: Harvest record management
- **costs**: Cost tracking and analysis
- **kaani**: AI chatbot interactions (Gemini API)
- **conversations**: Chat history management
- **auth**: Authentication (demo mode)

Example usage:
```typescript
// Frontend
const { data: farms } = trpc.farms.list.useQuery();
const createFarm = trpc.farms.create.useMutation();
```

---

## 🤖 KaAni AI Integration

KaAni is powered by Google Gemini API and provides:

- **Bilingual Support**: Filipino and English responses
- **Agricultural Context**: Specialized knowledge for Philippine farming
- **7 Categories**: Rice farming, loans, AgScore, pest control, market prices, weather, general
- **Conversation History**: Persistent chat across sessions
- **Streaming Responses**: Real-time SSE streaming for natural conversation

### Setting up Google AI Studio

1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env`: `GOOGLE_AI_STUDIO_API_KEY=your_key_here`
3. Restart the dev server

---

## 🗺️ Google Maps Integration

The app uses Google Maps for:
- Farm location selection
- Boundary drawing (polygons)
- Multi-parcel support
- Area calculation
- KML/GeoJSON import/export

**No API key required** - Uses Manus proxy for authentication.

---

## 📊 Analytics

The analytics dashboard provides:
- Harvest trends by region (line chart)
- Crop performance comparison (bar chart)
- Cost breakdown (doughnut chart)
- ROI by crop (horizontal bar chart)
- Regional comparison (grouped bar chart)

Built with Chart.js for interactive visualizations.

---

## 🚢 Deployment

### Build for Production

```bash
pnpm build
```

This creates:
- `dist/client/` - Frontend static files
- `dist/server/` - Backend Node.js bundle

### Environment Variables for Production

Ensure all required environment variables are set in your production environment:

**Critical:**
- `DATABASE_URL` - MySQL connection string
- `GOOGLE_AI_STUDIO_API_KEY` - For KaAni AI
- `JWT_SECRET` - For session security

**Optional (Manus platform):**
- `BUILT_IN_FORGE_API_KEY` - For S3 storage
- `OAUTH_SERVER_URL` - For OAuth login

### Database Migration

Before deploying, run migrations:
```bash
pnpm db:push
```

---

## 🧪 Testing

Run the test suite:
```bash
pnpm test
```

Manual testing checklist:
- [ ] Farm creation with boundary drawing
- [ ] Harvest record entry
- [ ] Cost tracking
- [ ] KaAni AI responses
- [ ] Analytics charts
- [ ] Role-based access control

---

## 📝 Documentation

Additional documentation available in `/docs`:

- `DAY_1_DATABASE_INTEGRATION_GUIDE.md` - Database setup
- `DAY_2_FARM_CRUD_GUIDE.md` - Farm CRUD operations
- `CHART_INTERACTIVITY.md` - Analytics implementation
- `CONVERSATION_SEARCH.md` - KaAni chat features
- `SSE_STREAMING_GUIDE.md` - Streaming implementation
- `FINAL_QA_REPORT.md` - QA testing results

---

## 🔐 Security Notes

**Demo Authentication:**
- Current implementation uses demo accounts for development
- **NOT suitable for production** - implement proper OAuth or JWT auth

**API Keys:**
- Never commit `.env` file to version control
- Use environment variables in production
- Rotate keys regularly

**Database:**
- Use connection pooling (configured in `server/db.ts`)
- Enable SSL for production database connections
- Regular backups recommended

---

## 🤝 Contributing

This is an MVP project for CARD MRI. For development workflow:

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

Engineering rails and QA enforcement are documented in the [Halo Foundry Playbook](docs/ai-studio-playbook.md).

---

## 📄 License

Proprietary - CARD MRI & AgSense.ai

---

## 🆘 Support

For issues or questions:
- GitHub Issues: https://github.com/gerome650/magsasa-card-kaani-erp/issues
- Email: gerome@agsense.ai

---

## 🎯 Roadmap

**Phase 1 (Current):**
- ✅ Farm management
- ✅ Harvest tracking
- ✅ KaAni AI chatbot
- ✅ Analytics dashboard

**Phase 2 (Planned):**
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Push notifications
- [ ] Advanced AgScore integration

**Phase 3 (Future):**
- [ ] Multi-cooperative support
- [ ] Blockchain integration
- [ ] IoT sensor integration
- [ ] Predictive analytics

---

**Built with ❤️ for Filipino farmers by AgSense.ai**
