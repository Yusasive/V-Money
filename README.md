# V-Money: Advanced Role-Based Fintech Platform

A comprehensive full-stack fintech platform with sophisticated role-based access control, built with React, Node.js, and Supabase.

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
- JWT-based authentication with Supabase
- Role-based route protection
- Secure password handling
- Session management

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
- **Supabase** for database and authentication
- **Cloudinary** for file storage
- **JWT** for session management

### Database
- **PostgreSQL** via Supabase
- Row Level Security (RLS) enabled
- Automated triggers for business logic

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
- Supabase account
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
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
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
   Create a `.env` file in the server directory:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ADMIN_REGISTRATION_UID=your_admin_uid
   ```

4. **Start server:**
   ```bash
   npm run dev
   ```

---

## 🗄️ Database Schema

### Core Tables

#### users
```sql
- id (uuid, primary key)
- email (text, unique)
- full_name (text)
- phone (text)
- username (text, unique)
- role (text) -- 'admin', 'staff', 'aggregator', 'merchant'
- status (text) -- 'pending', 'approved', 'suspended', 'rejected'
- onboarding_data (jsonb)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### tasks
```sql
- id (uuid, primary key)
- title (text)
- description (text)
- assigned_to (uuid, foreign key)
- created_by (uuid, foreign key)
- status (text) -- 'pending', 'in_progress', 'completed', 'rejected'
- due_date (timestamptz)
- completed_at (timestamptz)
- approved_by (uuid, foreign key)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### disputes
```sql
- id (uuid, primary key)
- title (text)
- description (text)
- raised_against (uuid, foreign key)
- created_by (uuid, foreign key)
- status (text) -- 'open', 'in_review', 'resolved'
- responses (jsonb)
- resolved_at (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### merchants
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- business_name (text)
- username (text, unique)
- email (text)
- phone (text)
- address (text)
- business_address (text)
- status (text) -- 'active', 'inactive', 'flagged'
- last_activity_date (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### merchant_transactions
```sql
- id (uuid, primary key)
- merchant_id (uuid, foreign key)
- transaction_date (date)
- transaction_count (integer)
- created_at (timestamptz)
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

### Task Management Endpoints

#### GET /api/tasks/assigned
Get tasks assigned to current user

#### POST /api/tasks
Create a new task (Staff/Admin only)
```json
{
  "title": "Complete merchant verification",
  "description": "Verify all merchant documents",
  "assigned_to": "user_uuid",
  "due_date": "2024-12-31T23:59:59Z"
}
```

#### PATCH /api/tasks/:id/done
Mark task as done (Aggregator)

#### PATCH /api/tasks/:id/approve
Approve completed task (Staff/Admin)

### Dispute Management Endpoints

#### GET /api/disputes
Get disputes (filtered by role)

#### POST /api/disputes
Create a new dispute (Staff/Admin)
```json
{
  "title": "Performance Issue",
  "description": "Aggregator not meeting targets",
  "raised_against": "aggregator_uuid"
}
```

#### POST /api/disputes/:id/respond
Respond to a dispute (Aggregator)
```json
{
  "response": "I will improve my performance"
}
```

### Merchant Management Endpoints

#### POST /api/merchants
Create a new merchant (Staff/Admin)

#### POST /api/merchants/:id/transactions
Record daily transactions (Staff/Admin)
```json
{
  "transaction_date": "2024-01-15",
  "transaction_count": 25
}
```

#### GET /api/merchants/flagged
Get flagged merchants (Admin only)

---

## 🛡️ Security Features

### Authentication Security
- JWT tokens with expiration
- Password hashing with bcrypt
- Secure session management
- Role-based access control

### Data Protection
- Row Level Security (RLS) on all tables
- Input validation and sanitization
- SQL injection prevention
- XSS protection

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

---

## 📊 Analytics & Reporting

### Dashboard Metrics
- **User Analytics**: Registration trends, active users, role distribution
- **Task Analytics**: Assignment rates, completion rates, average time
- **Dispute Analytics**: Resolution rates, response times, escalation patterns
- **Merchant Analytics**: Performance trends, flagging rates, transaction volumes

### Reporting Features
- Exportable reports in CSV/PDF format
- Scheduled report generation
- Custom date range filtering
- Role-based report access

---

## 🚀 Development Guidelines

### Code Organization
- **Components**: Reusable UI components in `/src/components`
- **Pages**: Route-specific components in `/src/pages`
- **Hooks**: Custom React hooks in `/src/hooks`
- **Utils**: Helper functions in `/src/utils`
- **API**: API client and endpoints in `/src/api`

### Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **CSS Classes**: Tailwind utility classes

### State Management
- React hooks for local state
- Context API for global state
- Custom hooks for data fetching
- Optimistic updates for better UX

### Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Logging for debugging
- Graceful fallbacks

---

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=your_backend_api_url
```

#### Backend (server/.env)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
JWT_SECRET=your_jwt_secret_key
PORT=5000
ADMIN_REGISTRATION_UID=secure_admin_registration_key
EMAIL_CONFIRM_REDIRECT_URL=http://localhost:3000/login
PASSWORD_RESET_REDIRECT_URL=http://localhost:3000/reset-password
```

### Supabase Configuration
1. Create a new Supabase project
2. Run the provided SQL migrations
3. Configure Row Level Security policies
4. Set up authentication providers
5. Configure email templates

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

# Run E2E tests
npm run test:e2e
```

---

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `build` folder
3. Configure environment variables
4. Set up custom domain (optional)

### Backend Deployment (Railway/Render)
1. Push code to Git repository
2. Connect repository to deployment platform
3. Configure environment variables
4. Deploy with auto-scaling enabled

### Database Deployment
- Supabase handles database hosting
- Configure production environment variables
- Set up database backups
- Monitor performance metrics

---

## 🔍 Monitoring & Maintenance

### Performance Monitoring
- Application performance metrics
- Database query optimization
- Error tracking and alerting
- User behavior analytics

### Maintenance Tasks
- Regular security updates
- Database optimization
- Log rotation and cleanup
- Backup verification

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
- Check environment variables configuration
- Verify Supabase connection and permissions
- Review browser console for client-side errors
- Check server logs for backend issues

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🔄 Version History

### v2.0.0 (Current)
- Complete role-based system implementation
- Modern UI/UX with glassmorphism design
- Enhanced security and authentication
- Comprehensive analytics dashboard
- Mobile-responsive design

### v1.0.0
- Initial release with basic functionality
- Simple admin dashboard
- Basic content management
- File upload capabilities

---

**Built with ❤️ by the V-Money Team**