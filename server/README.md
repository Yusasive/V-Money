# Vmonie Backend Setup

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
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
MONGODB_URI=mongodb://localhost:27017/vmonie
JWT_SECRET=your_jwt_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=5000
```

## Configuration

### MongoDB Setup
- Install MongoDB locally or use MongoDB Atlas
- Update the `MONGODB_URI` in your `.env` file

### Cloudinary Setup
1. Create a free account at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret from the dashboard
3. Update the Cloudinary variables in your `.env` file

### JWT Secret
Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
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
- `POST /api/auth/register` - Register admin user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Content Management
- `GET /api/content` - Get all content
- `GET /api/content/:section` - Get content by section
- `POST /api/content/:section` - Create/update content (admin only)
- `DELETE /api/content/:section` - Delete content (admin only)

### Form Submissions
- `POST /api/forms/submit` - Submit form (public)
- `GET /api/forms` - Get all submissions (admin only)
- `GET /api/forms/:id` - Get single submission (admin only)
- `PATCH /api/forms/:id` - Update submission status (admin only)
- `DELETE /api/forms/:id` - Delete submission (admin only)

### File Upload
- `POST /api/upload/single` - Upload single file (admin only)
- `POST /api/upload/multiple` - Upload multiple files (admin only)

## Default Admin User

To create the first admin user, make a POST request to `/api/auth/register`:

```json
{
  "email": "admin@vmonie.com",
  "password": "your_secure_password"
}
```

## Database Models

### User
- email (unique)
- password (hashed)
- role (admin/user)

### Content
- section (hero, main1, main2, etc.)
- title, subtitle, description
- buttonText, buttonLink, imageUrl
- features, faqs, testimonials, pricing arrays

### FormSubmission
- formType (onboarding, contact, loan)
- data (form fields)
- files (uploaded files with Cloudinary URLs)
- status (pending, reviewed, approved, rejected)
- notes

## Security Features
- JWT authentication
- Password hashing with bcrypt
- Admin-only routes protection
- File upload validation
- CORS configuration

## File Storage
All uploaded files are stored in Cloudinary with automatic optimization and CDN delivery.