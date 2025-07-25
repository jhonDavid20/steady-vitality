# Steady Vitality Backend API

A health & fitness coaching platform backend built with Node.js, TypeScript, TypeORM, and PostgreSQL.

## 🚀 Quick Start

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker Setup (Recommended)
```bash
# Start all services (app, database, admin panel)
docker-compose up -d

# View logs
docker-compose logs app

# Stop services
docker-compose down
```

## 📡 API Endpoints

### Base URL
- **Development**: `http://localhost:3000`
- **Health Check**: `GET /health`
- **API Overview**: `GET /api`

### 🔐 Authentication Endpoints

All authentication endpoints are under `/api/auth`

#### 1. User Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123@",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "client",
    "isEmailVerified": false
  },
  "tokens": {
    "accessToken": "jwt-access-token-here",
    "refreshToken": "jwt-refresh-token-here",
    "expiresIn": 86400
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

#### 2. User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123@"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "client",
    "isEmailVerified": false,
    "lastLoginAt": "2025-07-23T19:35:47.684Z",
    "createdAt": "2025-07-23T19:35:40.745Z"
  },
  "tokens": {
    "accessToken": "jwt-access-token-here",
    "refreshToken": "jwt-refresh-token-here",
    "expiresIn": 86400
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

#### 3. Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer your-access-token-here
```

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "client",
    "isEmailVerified": false,
    "lastLoginAt": "2025-07-23T19:35:47.684Z",
    "createdAt": "2025-07-23T19:35:40.745Z"
  }
}
```

**Response (Error - 401):**
```json
{
  "error": "Authentication required",
  "message": "No token provided"
}
```

#### 4. User Logout
```http
POST /api/auth/logout
Authorization: Bearer your-access-token-here
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Response (Error - 401):**
```json
{
  "error": "Invalid session",
  "message": "Session has expired or been revoked"
}
```

## 🛡️ Authentication Flow for Frontend

### 1. Registration Flow
```javascript
const register = async (userData) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // Store tokens
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      
      // Redirect to dashboard or email verification
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};
```

### 2. Login Flow
```javascript
const login = async (email, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.success) {
      // Store tokens
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};
```

### 3. Protected API Calls
```javascript
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`/api${endpoint}`, config);
    
    if (response.status === 401) {
      // Token expired, redirect to login
      localStorage.clear();
      window.location.href = '/login';
      return;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Example usage
const getCurrentUser = () => apiCall('/auth/me');
```

### 4. Logout Flow
```javascript
const logout = async () => {
  const token = localStorage.getItem('accessToken');
  
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of API call result
    localStorage.clear();
    window.location.href = '/login';
  }
};
```

## 🔒 Password Requirements

- Minimum 8 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter  
- Must contain at least one number
- Must contain at least one special character (@, !, #, $, %, etc.)

## 🎭 User Roles

- **client**: Default role for regular users
- **coach**: Can manage client programs and workouts
- **admin**: Full system access and user management

## 📊 Database Access

### Adminer (Database Admin Panel)
- **URL**: http://localhost:8080
- **Server**: postgres
- **Username**: steadyuser
- **Password**: steadypass123
- **Database**: steady_vitality

## 🚨 Error Handling

### Common HTTP Status Codes
- **200**: Success
- **201**: Created (registration success)
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid credentials/token)
- **403**: Forbidden (insufficient permissions)
- **429**: Too Many Requests (rate limiting)
- **500**: Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error type (optional)"
}
```

## 🔄 Rate Limiting

- **General API**: 1000 requests per 15 minutes (development)
- **Auth endpoints**: 5 requests per 15 minutes
- Rate limits are IP-based

## 🏗️ Frontend Integration Checklist

### Required Features
- [ ] Registration form with validation
- [ ] Login form with error handling
- [ ] Protected route wrapper component
- [ ] Token storage and management
- [ ] Automatic logout on token expiration
- [ ] User profile display
- [ ] Logout functionality

### Optional Features  
- [ ] Remember me checkbox
- [ ] Password strength indicator
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Session management (view/revoke sessions)
- [ ] Profile editing

## 🛠️ Development Tools

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run clean` - Clean build artifacts

### Docker Commands
```bash
# Start all services
docker-compose up -d

# View application logs
docker-compose logs app -f

# Restart just the app
docker-compose restart app

# Stop all services
docker-compose down

# Reset database (removes all data)
docker-compose down -v && docker-compose up -d
```

## 🌐 Environment Variables

The application uses environment variables for configuration. Key variables:

```env
# Application
NODE_ENV=development
PORT=3000

# Database  
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=steadyuser
DB_PASSWORD=steadypass123
DB_NAME=steady_vitality

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Security
BCRYPT_ROUNDS=12
```

## 📞 Support

- **Health Check**: GET `/health` - Check if the API is running
- **API Overview**: GET `/api` - List available endpoints
- **Application Logs**: `docker-compose logs app`

For issues, check the application logs and ensure all services are running properly.