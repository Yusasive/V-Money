# V-Money Backend - MongoDB Edition

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account

## Installation

1. Navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the server directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/vmonie
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/vmonie

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_USER=your_email@domain.com
MAIL_PASS=your_email_password
MAIL_FROM=noreply@vmonie.com

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Admin Registration
ADMIN_REGISTRATION_UID=secure_admin_registration_key_change_this
```

## Configuration

### MongoDB Setup

#### Local MongoDB
- Install MongoDB Community Edition
- Start MongoDB service: `mongod`
- The application will automatically connect and create collections

#### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string from "Connect" → "Connect your application"
4. Update the `MONGODB_URI` in your `.env` file

### Cloudinary Setup

1. Create a free account at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret from the dashboard
3. Update the Cloudinary variables in your `.env` file

### JWT Secret

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Database Setup

### Seed the Database

```bash
# Seed initial content
npm run seed
```

### Create Admin User

```bash
# Create the first admin user
npm run create-admin admin@vmonie.com securepassword "System Administrator"
```

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register user (Aggregator/Staff)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/change-password` - Change password (authenticated)

### User Management

- `GET /api/users` - Get all users (Admin/Staff)
- `GET /api/users/:id` - Get single user
- `PATCH /api/users/:id` - Update user
- `PATCH /api/users/:id/approve` - Approve user (Admin)
- `PATCH /api/users/:id/reject` - Reject user (Admin)
- `PATCH /api/users/:id/suspend` - Suspend user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Task Management

- `GET /api/tasks` - Get all tasks (Staff/Admin)
- `GET /api/tasks/assigned` - Get assigned tasks
- `POST /api/tasks` - Create task (Staff/Admin)
- `PATCH /api/tasks/:id/done` - Mark task as done
- `PATCH /api/tasks/:id/approve` - Approve task (Staff/Admin)
- `PATCH /api/tasks/:id/reject` - Reject task (Staff/Admin)
- `DELETE /api/tasks/:id` - Delete task (Admin)

### Dispute Management

- `GET /api/disputes` - Get disputes (filtered by role)
- `POST /api/disputes` - Create dispute (Staff/Admin)
- `POST /api/disputes/:id/respond` - Respond to dispute
- `PATCH /api/disputes/:id` - Update dispute status (Staff/Admin)
- `PATCH /api/disputes/:id/close` - Close dispute (Staff/Admin)
- `DELETE /api/disputes/:id` - Delete dispute (Admin)

### Merchant Management

- `GET /api/merchants/:id` - Get merchant details
- `POST /api/merchants` - Create merchant (Staff/Admin)
- `PATCH /api/merchants/me` - Update own profile (Merchant)
- `PATCH /api/merchants/:id` - Update merchant (Staff/Admin)
- `POST /api/merchants/:id/transactions` - Record transactions (Staff/Admin)
- `GET /api/merchants/:id/transactions` - Get transactions
- `GET /api/merchants/flagged` - Get flagged merchants (Admin)

### Analytics

- `GET /api/analytics/overview` - System overview (Admin/Staff)
- `GET /api/analytics/users` - User statistics (Admin)
- `GET /api/analytics/tasks` - Task analytics (Admin/Staff)
- `GET /api/analytics/merchants` - Merchant analytics (Admin/Staff)

### Content Management

- `GET /api/content` - Get all content
- `GET /api/content/:section` - Get content by section
- `POST /api/content/:section` - Create/update content (Admin/Staff)
- `DELETE /api/content/:section` - Delete content (Admin)

### Form Submissions

- `POST /api/forms/submit` - Submit form (public)
- `GET /api/forms` - Get all submissions (Admin/Staff)
- `GET /api/forms/:id` - Get single submission (Admin/Staff)
- `PATCH /api/forms/:id` - Update submission status (Admin/Staff)
- `DELETE /api/forms/:id` - Delete submission (Admin)

### File Upload

- `POST /api/upload/single` - Upload single file (Admin/Staff)
- `POST /api/upload/multiple` - Upload multiple files (Admin/Staff)
- `GET /api/upload/list` - List uploaded files (Admin/Staff)

### Health Check

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system health

## Database Models

### User Model
- Authentication and user management
- Role-based access control
- Password hashing with bcrypt
- Email verification and password reset

### Task Model
- Task assignment and tracking
- Status workflow management
- File attachments support
- Performance analytics

### Dispute Model
- Dispute creation and resolution
- Response tracking
- Escalation management
- Priority levels

### Merchant Model
- Merchant profile management
- Transaction tracking
- Auto-flagging system
- Document storage

### Content Model
- Dynamic content management
- Multi-type content support
- Version control ready

### FormSubmission Model
- Form data storage
- File attachment handling
- Status tracking
- Email notifications

## Security Features

- JWT authentication with secure tokens
- Password hashing with bcrypt (12 rounds)
- Role-based access control
- Input validation with express-validator
- File upload validation
- CORS configuration
- Rate limiting ready

## Performance Features

- MongoDB indexes for optimized queries
- Aggregation pipelines for analytics
- Efficient pagination
- Connection pooling
- Query optimization

## File Storage

All uploaded files are stored in Cloudinary with:
- Automatic optimization
- CDN delivery
- Secure URLs
- File type validation

## Business Logic

### Auto-flagging System
Merchants are automatically flagged when they have less than 10 transactions per day for 7 consecutive days. This is implemented in the transaction recording endpoint.

### Role-based Access
- **Admin**: Full system access
- **Staff**: Task and merchant management
- **Aggregator**: Task completion and dispute response
- **Merchant**: Profile management only

## Scripts

```bash
# Development
npm run dev

# Production
npm start

# Database seeding
npm run seed

# Create admin user
npm run create-admin <email> <password> [fullName]

# Testing
npm test
npm run test:watch
```

## Monitoring

### Health Checks
- Basic: `GET /api/health`
- Detailed: `GET /api/health/detailed`

### Logging
- Console logging for development
- Error tracking for production
- Request/response logging

### Performance
- Database query monitoring
- Response time tracking
- Memory usage monitoring

## Migration from Supabase

This version has been completely migrated from Supabase to MongoDB:

### What Changed
- Database: PostgreSQL → MongoDB
- Authentication: Supabase Auth → JWT + bcrypt
- ORM: Supabase client → Mongoose
- Schema: SQL → MongoDB collections
- Security: RLS → Application middleware

### Migration Benefits
- Full control over authentication
- Flexible schema design
- Better performance with proper indexing
- Lower operational costs
- Custom business logic implementation

### Compatibility
- All API endpoints remain the same
- Frontend requires no changes
- Same authentication flow
- Identical response formats