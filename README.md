# ShowUp: AI-Powered E-Commerce Recommendation Engine

ShowUp is a production-ready, full-stack e-commerce recommendation system that combines real-time event tracking, rule-based heuristics, and Google Gemini AI to deliver highly personalized shopping experiences.

## Key Features

- **Hybrid Recommendations**: Combines Category Similarity, Product Popularity, and Recency with AI-driven re-ranking using Gemini 2.5 Flash Lite
- **Contextual Awareness**: Custom endpoints for Home Feed, Similar Products, and Cart Cross-selling
- **AI-Powered Explanations**: Uses Google Gemini AI to provide human-readable reasons for recommendations (e.g., "Recommended because you bought similar tech items")
- **Ultra-Fast Performance**: < 500ms API response time enforced by Redis caching and AI execution timeouts
- **Real-time Tracking**: Captures views, clicks, cart actions, and purchases to update user profiles instantly
- **Guest & Authenticated Users**: Supports both guest browsing (session-based) and authenticated users with personalized recommendations
- **Shopping Cart**: Full cart functionality with add/remove items, quantity management, and checkout
- **Order Management**: Complete order creation and tracking system
- **Production Secure**: JWT Authentication, Redis-based Rate Limiting, NoSQL Injection protection, and XSS sanitization

## Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Vite + JSX)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express API    │
│   (Node.js)     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│ MongoDB│ │  Redis   │
│ (Data) │ │ (Cache)  │
└────────┘ └────┬─────┘
                │
                ▼
         ┌─────────────┐
         │ Google      │
         │ Gemini AI   │
         └─────────────┘
```

### Data Flow

1. **User Events** → Tracked in MongoDB and cached in Redis
2. **Recommendation Request** → Check Redis cache first
3. **Cache Miss** → Generate candidates using rule-based logic
4. **AI Enhancement** → Send top candidates to Gemini for re-ranking (with timeout fallback)
5. **Response** → Cache results in Redis and return to client

## Recommendation Logic

The engine uses a tiered scoring approach:

1. **Candidate Generation**: Filters products by category similarity or global popularity
2. **Rule-based Scoring**:
   - **Similarity**: +50 points for same category
   - **Popularity**: Up to +30 points based on sales/clicks
   - **Recency**: Boosts newer products
3. **AI Enhancement**:
   - Top candidates are sent to **Gemini 2.5 Flash Lite**
   - Gemini re-ranks them based on user history and generates natural language explanations
   - **SLA Enforcement**: If Gemini takes > 400ms, the system falls back to rule-based scores to ensure < 500ms total latency

## Redis Usage

- **Session Events Buffer**: User events stored in Redis lists for rapid session analysis
- **Recommendation Cache**: Final results cached with 5-10 minute TTL
- **Cache Invalidation**: Any "Buy" or "Click" event automatically invalidates user's recommendation cache
- **Rate Limiting**: Redis-based rate limiting for API protection

## Tech Stack

### Frontend
- **React 19** with Vite
- **React Router** for navigation
- **Axios** for API calls
- **Context API** for state management (Cart & Auth)
- Modern CSS with gradients and animations

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose (optimized schemas with indexes)
- **Redis** for caching and rate limiting
- **JWT** for authentication
- **Google Gemini AI** for recommendation enhancement
- **Swagger/OpenAPI** for API documentation

### Security
- Helmet.js for HTTP headers
- XSS protection
- MongoDB injection protection
- Input validation with Joi
- Rate limiting with Redis

## Installation & Setup

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (Local installation or MongoDB Atlas)
- **Redis Server** (Local installation or cloud Redis)
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Spotmies LLC"
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/showup
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/showup

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_ACCESS_EXPIRATION_MINUTES=1440

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# Or for cloud Redis:
# REDIS_URL=redis://username:password@host:port

# Google Gemini AI
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

### 4. Start Services

Make sure MongoDB and Redis are running:

```bash
# Start MongoDB (if local)
mongod

# Start Redis (if local)
redis-server
```

### 5. Seed Database (Optional)

```bash
cd backend
node src/scripts/seed.js
```

This will create:
- 100 sample products
- 10 test users
- Sample orders and events

### 6. Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Server runs on http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

## API Documentation

Once the backend is running, access the interactive Swagger documentation at:

**http://localhost:5000/v1/api-docs**

### Main Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

#### Recommendations
- `GET /api/v1/recommendations/home` - Home page recommendations (supports guest users)
- `GET /api/v1/recommendations/product/:productId` - Similar products
- `GET /api/v1/recommendations/cart` - Cart cross-sell recommendations

#### Tracking
- `POST /api/v1/tracking` - Track user events (view, click, add_to_cart, purchase)
- `GET /api/v1/tracking/recent` - Get recent events

#### Orders
- `POST /api/v1/orders` - Create order (requires authentication)
- `GET /api/v1/orders` - Get user's orders
- `GET /api/v1/orders/:orderId` - Get order details

## Testing

### Load Testing with k6

```bash
cd backend
k6 run tests/loadtest.js
```

This will simulate 100 virtual users for 30 seconds and verify that 95% of requests complete in under 500ms.

## Features in Detail

### Guest User Support
- Users can browse and see recommendations without logging in
- Session-based tracking using `session_id`
- Seamless transition to authenticated mode after login

### Shopping Cart
- Add/remove products
- Update quantities
- Real-time cart total calculation
- Cart persistence in localStorage
- Cart badge in navbar showing item count

### Checkout Flow
- Requires user authentication
- Validates stock availability
- Creates order in database
- Updates product stock and popularity
- Tracks purchase events
- Clears cart after successful checkout

### AI Recommendations
- Personalized explanations for each recommendation
- Fallback to rule-based logic if AI fails or times out
- Context-aware recommendations based on:
  - Recent views
  - Purchase history
  - Cart contents
  - Product categories

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Redis-based rate limiting (50 req/15min for recommendations)
- **Input Validation**: Joi schema validation for all inputs
- **XSS Protection**: XSS-clean middleware
- **NoSQL Injection Protection**: express-mongo-sanitize
- **CORS**: Configured for frontend origin
- **Helmet**: Security HTTP headers

## Database Schema

### User
- Authentication (email, password)
- Preferences (categories, notifications)
- Indexed on email and preferences

### Product
- Basic info (name, description, category, price)
- Metadata (tags, popularity, stock)
- Indexed on category, popularity, and text search

### Order
- User reference
- Products with quantities and prices
- Total amount and status
- Indexed on user and creation date

### UserEvent
- Event tracking (view, click, add_to_cart, purchase)
- User and product references
- Timestamp and metadata
- Indexed on user, event type, and product

## Deployment

### Backend Deployment

1. Set environment variables in your hosting platform
2. Ensure MongoDB and Redis are accessible
3. Build and start:
   ```bash
   npm start
   ```

### Frontend Deployment

1. Build for production:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy the `dist` folder to your hosting service
3. Update API URL in `frontend/src/api/client.js` or use environment variable

## Contributing

This project was built as a technical assignment for Spotmies LLC. For production use, consider:

- Adding unit and integration tests
- Implementing payment gateway integration
- Adding email notifications
- Implementing product search functionality
- Adding admin dashboard
- Setting up CI/CD pipeline

## Acknowledgments

- Google Gemini AI for recommendation enhancement
- MongoDB for data persistence
- Redis for caching and performance
- React and Express.js communities
