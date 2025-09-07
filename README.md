# V-Money: Advanced Role-Based Fintech Platform

A comprehensive full-stack fintech platform with sophisticated role-based access control, built with React, Node.js, and MongoDB.

## 🌟 Features

### 🎯 Role-Based System
- **Aggregator**: Task management, dispute handling, profile management
- **Staff**: Task assignment, merchant management, dispute creation
- **Admin**: Complete system oversight, user management, analytics

### 🎨 Modern UI/UX
- Glassmorphism design with backdrop blur effects
- Smooth animations and micro-interactions
- Dark mode support with system preference detection
- Fully responsive design optimized for all devices
- Consistent 8px spacing grid system

### 🔐 Advanced Security
- JWT-based authentication with bcrypt password hashing
- Role-based route protection with middleware
- Secure password handling and validation
- Session management and token expiration

## 📋 Table of Contents

- [System Architecture](#system-architecture)
- [Role Specifications](#role-specifications)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Development Guidelines](#development-guidelines)
- [Deployment](#deployment)

---

## 🏗️ System Architecture

### Frontend Stack
- **React 18** with functional components and hooks
- **React Router** for client-side routing
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **React Hot Toast** for notifications

### Backend Stack
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication and session management
- **Cloudinary** for file storage
- **Nodemailer** for email notifications

### Database
- **MongoDB** with Mongoose ODM
- Comprehensive indexing for performance
- Data validation and schema enforcement
- Automated business logic with middleware

---

## 👥 Role Specifications

### 1. Aggregator Role

#### 1.1 Authentication & Access
- **Sign-up Fields**: Full Name, Email, Phone Number, Username, Password
- **Approval Process**: Requires Admin approval before dashboard access
- **Login Flow**: Standard email/password with forgot password option

#### 1.2 Dashboard Features

**Homepage**
- Personal analytics dashboard showing:
  - Tasks assigned vs completed
  - Active disputes requiring response
  - Performance metrics and trends
- Recent activity feed
- Quick action buttons

**Tasks Page**
- View all assigned tasks with detailed information
- Filter tasks by status (pending, in progress, completed, rejected)
- Mark tasks as "Done" (requires approval from assigner)
- Task details include:
  - Task title and description
  - Assigner information
  - Due date and priority
  - Creation and completion timestamps

**Profile Management**
- **Tab 1: Basic Profile**
  - View and edit personal information
  - Update contact details
  - Change username (if allowed)
- **Tab 2: Onboarding Information**
  - View/edit onboarding details (only if form was submitted)
  - Update business information
  - Document management

### 2. Staff Role

#### 2.1 Authentication & Access
- **Sign-up Fields**: Same as Aggregator
- **Login Flow**: Standard authentication with role verification

#### 2.2 Dashboard Features

**Homepage**
- Comprehensive analytics showing:
  - Number of tasks assigned and their status
  - Disputes raised and resolved
  - Merchants managed and their performance
  - Team productivity metrics

**Tasks Page**
- Create new tasks and assign to Aggregators (by username)
- Approve or reject tasks marked as "done" by Aggregators
- View all tasks created by the staff member
- Task management with detailed tracking

**Dispute Page**
- Create disputes for specific Aggregators (by username)
- Monitor dispute status and responses
- Close disputes after resolution
- Dispute escalation to Admin if needed

**Merchants Page**
- Add new merchants to the system
- Record daily merchant transactions
- Monitor merchant performance
- **Business Rule**: Minimum 10 transactions per day
- **Auto-flagging**: If merchant has <10 transactions/day for 7 consecutive days:
  - System automatically flags the merchant
  - Admin receives notification
  - Merchant status changes to "flagged"

**Profile Management**
- **Tab 1: Basic Profile** (same as Aggregator)
- **Tab 2: Onboarding Information** (same as Aggregator)

### 3. Admin Role

#### 3.1 Authentication & Access
- **Login Only**: No public sign-up (accounts created by existing admins)
- **Super User**: Full system access and override capabilities

#### 3.2 Dashboard Features

**Homepage**
- **Comprehensive System Analytics**:
  - User statistics (Aggregators, Staff, Merchants)
  - Task metrics (assigned, completed, pending, rejected)
  - Dispute overview (open, closed, escalated)
  - Merchant performance (active vs flagged)
  - System health and performance metrics

**User Management**
- Approve/Reject Aggregator sign-up requests
- Manage Staff and Aggregators:
  - Create new accounts
  - Suspend or deactivate users
  - Reset passwords
  - View user activity logs

**Task Management**
- Create tasks (same capabilities as Staff)
- Approve/reject tasks (same capabilities as Staff)
- View all tasks system-wide
- Task analytics and reporting
- Override task decisions

**Dispute Management**
- Oversee all disputes created by Staff
- View dispute history and responses
- Override or close disputes when necessary
- Escalate disputes to higher authorities
- Generate dispute reports

**Merchant Management**
- View and oversee all merchants and transaction records
- Review auto-flagged merchants
- Merchant performance analytics
- Transaction trend analysis
- Merchant approval and suspension

**Profile Management**
- Edit Admin's personal profile
- System configuration settings
- Audit log access

---

## 🚀 Installation

### Prerequisites
- Node.js v18+
- npm or yarn
- MongoDB (local installation or MongoDB Atlas)
- Cloudinary account (for file uploads)

### Frontend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/v-money.git
   cd v-money
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start development server:**
   ```bash
   npm start
   ```

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the server directory (copy from `.env.example`):
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/vmonie
   
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

4. **Database Setup:**
   ```bash
   # Seed the database with initial content
   npm run seed
   
   # Create the first admin user
   npm run create-admin admin@vmonie.com securepassword "System Administrator"
   ```

5. **Start server:**
   ```bash
   npm run dev
   ```

---

## 🗄️ Database Schema

### Core Collections

#### users
```javascript
{
  _id: ObjectId,
  fullName: String (required),
  email: String (required, unique),
  phone: String (required),
  username: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['admin', 'staff', 'aggregator', 'merchant']),
  status: String (enum: ['pending', 'approved', 'suspended', 'rejected']),
  onboardingData: Mixed,
  lastLogin: Date,
  isEmailVerified: Boolean,
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### tasks
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  assignedTo: ObjectId (ref: 'User', required),
  createdBy: ObjectId (ref: 'User', required),
  status: String (enum: ['pending', 'in_progress', 'done', 'completed', 'rejected']),
  priority: String (enum: ['low', 'medium', 'high']),
  dueDate: Date,
  completedAt: Date,
  approvedBy: ObjectId (ref: 'User'),
  approvedAt: Date,
  notes: String,
  attachments: [{ filename, originalName, cloudinaryUrl, publicId }],
  createdAt: Date,
  updatedAt: Date
}
```

#### disputes
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String (required),
  raisedAgainst: ObjectId (ref: 'User', required),
  createdBy: ObjectId (ref: 'User', required),
  status: String (enum: ['open', 'in_review', 'resolved', 'escalated']),
  priority: String (enum: ['low', 'medium', 'high', 'urgent']),
  responses: [{
    respondedBy: ObjectId (ref: 'User'),
    response: String,
    createdAt: Date
  }],
  resolvedAt: Date,
  resolvedBy: ObjectId (ref: 'User'),
  escalatedAt: Date,
  escalatedBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

#### merchants
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required, unique),
  businessName: String (required),
  username: String (required, unique),
  email: String (required),
  phone: String (required),
  address: String (required),
  businessAddress: String,
  status: String (enum: ['active', 'inactive', 'flagged', 'suspended']),
  firstName: String (required),
  middleName: String,
  lastName: String (required),
  gender: String (enum: ['Male', 'Female', 'Other']),
  state: String (required),
  lga: String (required),
  bvn: String (required, 11 digits),
  nin: String (required, 11 digits),
  serialNo: String,
  utilityBillUrl: String,
  passportUrl: String,
  businessPicUrl: String,
  ninSlipUrl: String,
  lastActivityDate: Date,
  flaggedAt: Date,
  flaggedReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### merchant_transactions
```javascript
{
  _id: ObjectId,
  merchantId: ObjectId (ref: 'Merchant', required),
  transactionDate: Date (required),
  transactionCount: Number (required, min: 0),
  recordedBy: ObjectId (ref: 'User', required),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### form_submissions
```javascript
{
  _id: ObjectId,
  formType: String (enum: ['onboarding', 'contact', 'loan', 'support']),
  data: Mixed (required),
  files: [{
    fieldName: String,
    originalName: String,
    cloudinaryUrl: String,
    publicId: String
  }],
  status: String (enum: ['pending', 'reviewed', 'approved', 'rejected']),
  notes: String,
  reviewedBy: ObjectId (ref: 'User'),
  reviewedAt: Date,
  emailSent: Boolean,
  emailSentAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### content
```javascript
{
  _id: ObjectId,
  section: String (required, unique),
  title: String,
  subtitle: String,
  description: String,
  buttonText: String,
  buttonLink: String,
  imageUrl: String,
  features: [{ icon, title, description }],
  faqs: [{ question, answer }],
  testimonials: [{ name, occupation, quote, imageUrl }],
  pricing: [{ amount, title, description }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔧 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user (Aggregator or Staff)
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "username": "johndoe",
  "password": "securepassword",
  "role": "aggregator"
}
```

#### POST /api/auth/login
User login
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### GET /api/auth/me
Get current user information (requires authentication)

#### POST /api/auth/forgot-password
Request password reset
```json
{
  "email": "john@example.com"
}
```

#### POST /api/auth/reset-password
Reset password with token
```json
{
  "token": "reset_token_here",
  "password": "newpassword"
}
```

### User Management Endpoints

#### GET /api/users
Get all users (Admin/Staff only)
- Query params: `page`, `limit`, `role`, `status`, `search`

#### PATCH /api/users/:id/approve
Approve user registration (Admin only)

#### PATCH /api/users/:id/reject
Reject user registration (Admin only)

#### PATCH /api/users/:id/suspend
Suspend user account (Admin only)

### Task Management Endpoints

#### GET /api/tasks/assigned
Get tasks assigned to current user

#### POST /api/tasks
Create a new task (Staff/Admin only)
```json
{
  "title": "Complete merchant verification",
  "description": "Verify all merchant documents",
  "assigned_to": "user_id_here",
  "due_date": "2024-12-31T23:59:59Z",
  "priority": "high"
}
```

#### PATCH /api/tasks/:id/done
Mark task as done (Aggregator)

#### PATCH /api/tasks/:id/approve
Approve completed task (Staff/Admin)

#### PATCH /api/tasks/:id/reject
Reject completed task (Staff/Admin)

### Dispute Management Endpoints

#### GET /api/disputes
Get disputes (filtered by role)

#### POST /api/disputes
Create a new dispute (Staff/Admin)
```json
{
  "title": "Performance Issue",
  "description": "Aggregator not meeting targets",
  "raised_against": "aggregator_user_id",
  "priority": "high"
}
```

#### POST /api/disputes/:id/respond
Respond to a dispute (Aggregator)
```json
{
  "response": "I will improve my performance and meet the targets"
}
```

#### PATCH /api/disputes/:id
Update dispute status (Staff/Admin)

### Merchant Management Endpoints

#### POST /api/merchants
Create a new merchant (Staff/Admin)

#### GET /api/merchants/:id
Get merchant details

#### PATCH /api/merchants/me
Update own merchant profile (Merchant only)

#### POST /api/merchants/:id/transactions
Record daily transactions (Staff/Admin)
```json
{
  "txn_date": "2024-01-15",
  "txn_count": 25,
  "notes": "Regular business day"
}
```

#### GET /api/merchants/flagged
Get flagged merchants (Admin only)

### Analytics Endpoints

#### GET /api/analytics/overview
Get system overview analytics (Admin/Staff)

#### GET /api/analytics/users
Get user statistics (Admin only)

#### GET /api/analytics/tasks
Get task analytics (Admin/Staff)

#### GET /api/analytics/merchants
Get merchant analytics (Admin/Staff)

---

## 🛡️ Security Features

### Authentication Security
- JWT tokens with configurable expiration
- Password hashing with bcrypt (12 rounds)
- Secure session management
- Role-based access control middleware

### Data Protection
- MongoDB schema validation
- Input validation with express-validator
- SQL injection prevention (NoSQL injection protection)
- XSS protection with data sanitization

### File Upload Security
- File type validation
- Size limits enforcement
- Secure cloud storage with Cloudinary
- Virus scanning (recommended for production)

---

## 🎨 Design System

### Color Palette
- **Primary**: #1E90FF (Dodger Blue)
- **Secondary**: #FF8C00 (Dark Orange)
- **Success**: #10B981 (Emerald)
- **Warning**: #F59E0B (Amber)
- **Danger**: #EF4444 (Red)
- **Gray Scale**: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900

### Typography
- **Font Family**: Lota Grotesque (primary), system fonts (fallback)
- **Font Weights**: 400 (normal), 600 (semibold), 700 (bold)
- **Line Heights**: 1.5 (body), 1.2 (headings)

### Spacing System
- Based on 8px grid: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px

### Component Library
- Reusable UI components with consistent styling
- Accessible design patterns
- Mobile-first responsive design

---

## 🔄 Business Logic & Workflows

### Task Workflow
1. **Creation**: Staff/Admin creates task and assigns to Aggregator
2. **Assignment**: Aggregator receives task notification
3. **Execution**: Aggregator works on task and marks as "Done"
4. **Approval**: Assigner approves or rejects the completed task
5. **Completion**: Task status updated to "Completed" or "Rejected"

### Dispute Workflow
1. **Creation**: Staff/Admin raises dispute against Aggregator
2. **Notification**: Aggregator receives dispute notification
3. **Response**: Aggregator provides response/explanation
4. **Review**: Staff/Admin reviews response
5. **Resolution**: Dispute marked as resolved or escalated

### Merchant Management Workflow
1. **Registration**: Staff/Admin adds new merchant
2. **Daily Tracking**: Staff records daily transaction counts
3. **Performance Monitoring**: System tracks transaction patterns
4. **Auto-flagging**: Merchants with <10 transactions/day for 7 days get flagged
5. **Admin Review**: Admin reviews flagged merchants for action

### Auto-flagging Algorithm
```javascript
// Merchant is flagged if:
// - Less than 10 transactions per day
// - For 7 consecutive days
// - System automatically updates status to 'flagged'
```

---

## 📊 Analytics & Reporting

### Dashboard Metrics
- **User Analytics**: Registration trends, active users, role distribution
- **Task Analytics**: Assignment rates, completion rates, average time
- **Dispute Analytics**: Resolution rates, response times, escalation patterns
- **Merchant Analytics**: Performance trends, flagging rates, transaction volumes

### Reporting Features
- Real-time analytics with MongoDB aggregation pipelines
- Custom date range filtering
- Role-based report access
- Performance metrics and trends

---

## 🚀 Development Guidelines

### Code Organization
- **Components**: Reusable UI components in `/src/components`
- **Pages**: Route-specific components in `/src/pages`
- **Hooks**: Custom React hooks in `/src/hooks`
- **Utils**: Helper functions in `/src/utils`
- **API**: API client and endpoints in `/src/api`
- **Models**: MongoDB models in `/server/models`
- **Routes**: Express routes in `/server/routes`
- **Middleware**: Authentication and validation in `/server/middleware`

### Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **CSS Classes**: Tailwind utility classes
- **Database**: camelCase for fields, PascalCase for models

### State Management
- React hooks for local state
- Context API for global state
- Custom hooks for data fetching
- Optimistic updates for better UX

### Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Server-side error logging
- Graceful fallbacks

---

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### Backend (server/.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/vmonie

# Authentication
JWT_SECRET=your_jwt_secret_key

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Service
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_USER=your_email@domain.com
MAIL_PASS=your_email_password
MAIL_FROM=noreply@vmonie.com

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Security
ADMIN_REGISTRATION_UID=secure_admin_registration_key
```

### MongoDB Configuration

#### Local MongoDB Setup
1. Install MongoDB Community Edition
2. Start MongoDB service: `mongod`
3. Create database: `use vmonie`
4. The application will automatically create collections

#### MongoDB Atlas Setup (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

---

## 📱 Mobile Responsiveness

### Breakpoints
- **Mobile**: 0-640px
- **Tablet**: 641-1024px
- **Desktop**: 1025px+

### Mobile Optimizations
- Touch-friendly interface elements
- Optimized navigation for small screens
- Responsive data tables
- Mobile-specific interactions

---

## 🧪 Testing

### Testing Strategy
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for UI elements
- End-to-end tests for critical workflows

### Test Commands
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

---

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `build` folder
3. Configure environment variables
4. Set up custom domain (optional)

### Backend Deployment (Railway/Render/Heroku)
1. Push code to Git repository
2. Connect repository to deployment platform
3. Configure environment variables
4. Deploy with auto-scaling enabled

### Database Deployment
- **Local**: MongoDB Community Edition
- **Cloud**: MongoDB Atlas with automated backups
- **Performance**: Configure indexes and monitoring
- **Security**: Enable authentication and SSL

---

## 🔍 Monitoring & Maintenance

### Performance Monitoring
- Application performance metrics
- Database query optimization with indexes
- Error tracking and alerting
- User behavior analytics

### Maintenance Tasks
- Regular security updates
- Database optimization and indexing
- Log rotation and cleanup
- Backup verification

### Database Maintenance
```bash
# Create database indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })
db.tasks.createIndex({ assignedTo: 1, status: 1 })
db.disputes.createIndex({ raisedAgainst: 1, status: 1 })
db.merchants.createIndex({ userId: 1 }, { unique: true })
```

---

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Submit pull request with detailed description
5. Code review and approval process

### Code Standards
- ESLint configuration for code quality
- Prettier for code formatting
- Conventional commits for version control
- Comprehensive documentation for new features

---

## 📞 Support

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: contact@vmonie.com for urgent matters

### Troubleshooting

#### Common Issues
1. **MongoDB Connection Failed**
   - Check if MongoDB is running: `mongod --version`
   - Verify connection string in `.env`
   - Check network connectivity for Atlas

2. **Authentication Errors**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure user status is 'approved'

3. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper CORS configuration

#### Database Issues
```bash
# Check MongoDB status
mongod --version

# Connect to MongoDB shell
mongo

# Show databases
show dbs

# Use vmonie database
use vmonie

# Show collections
show collections

# Check user count
db.users.countDocuments()
```

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🔄 Version History

### v2.0.0 (Current)
- **BREAKING**: Migrated from Supabase to MongoDB
- Complete role-based system implementation
- Modern UI/UX with glassmorphism design
- Enhanced security with JWT and bcrypt
- Comprehensive analytics dashboard
- Mobile-responsive design
- Auto-flagging system for merchants
- Email notification system

### v1.0.0
- Initial release with Supabase
- Basic admin dashboard
- Simple content management
- File upload capabilities

---

## 🔄 Migration Notes

### From Supabase to MongoDB

#### Key Changes
- **Database**: PostgreSQL → MongoDB with Mongoose
- **Authentication**: Supabase Auth → JWT with bcrypt
- **Schema**: SQL tables → MongoDB collections with schemas
- **Queries**: SQL → MongoDB queries and aggregations
- **Security**: RLS → Application-level role checking

#### Migration Benefits
- **Full Control**: Complete control over database and authentication
- **Flexibility**: More flexible schema design with MongoDB
- **Performance**: Optimized queries with proper indexing
- **Cost**: Potentially lower costs with self-hosted MongoDB
- **Customization**: Custom authentication flows and business logic

#### Breaking Changes
- All API endpoints now use MongoDB ObjectIds instead of UUIDs
- Authentication flow changed from Supabase to JWT
- Database queries updated to use Mongoose syntax
- Environment variables updated for MongoDB connection

---

**Built with ❤️ by the V-Money Team**

*Powered by MongoDB, Express.js, React, and Node.js (MERN Stack)*