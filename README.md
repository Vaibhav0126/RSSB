# 🙏 RSSB Spiritual Platform

> **Radha Soami Satsang Beas - Science of the Soul**  
> A comprehensive digital platform for spiritual growth, knowledge sharing, and community engagement.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

## 📖 Overview

RSSB Platform is a modern, full-stack web application designed to facilitate spiritual learning and community interaction. Built with **React**, **Node.js**, **TypeScript**, and **PostgreSQL**, it provides a comprehensive ecosystem for spiritual seekers to access sacred literature, engage in meaningful discussions, and participate in spiritual activities.

### ✨ Key Features

- 📚 **Digital Library**: Access to spiritual books with advanced search capabilities
- 💬 **Discussion Forums**: Quora-style Q&A platform for spiritual inquiries
- 👥 **Role-Based Access**: Multi-tier user management system
- 📅 **Meeting Management**: Schedule and manage spiritual gatherings
- 🔔 **Smart Notifications**: Real-time updates for relevant activities
- 🔐 **Secure Authentication**: OTP-based login system
- 📱 **Responsive Design**: Optimized for mobile and desktop

## 🏗️ Architecture

### Frontend Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Query** for state management & caching
- **React Router** for navigation
- **Heroicons** for UI icons

### Backend Stack

- **Node.js** with Express.js
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL
- **JWT** authentication
- **Nodemailer** for email services

### Database

- **PostgreSQL** with Prisma schema
- Optimized queries with indexing
- Role-based data access patterns

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Vaibhav0126/RSSB.git
   cd RSSB
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   # Backend environment (.env in /backend)
   DATABASE_URL="postgresql://username:password@localhost:5432/rssb_db"
   JWT_SECRET="your-jwt-secret-key"
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT=587
   EMAIL_USER="rssbsearch@gmail.com"
   EMAIL_PASS="your-app-password"
   NODE_ENV="development"
   PORT=5001
   ```

4. **Setup database**

   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## 👥 User Roles & Permissions

### 🔴 Admin

- **Full system control**
- User management (create, edit, delete)
- Content moderation
- Meeting scheduling for all roles
- Access to dashboard analytics

### 🟣 Mentor

- **Guidance & oversight**
- Register SK/ASK users
- Schedule meetings
- Content management
- Moderate discussions

### 🔵 SK (Satsang Karta)

- **Local coordination**
- View assigned meetings
- Access library & discussions
- Receive meeting notifications

### 🟢 ASK (Assistant Satsang Karta)

- **Support role**
- View assigned meetings
- Access library & discussions
- Receive meeting notifications

### 🟡 User (Public)

- **General access**
- Browse library
- Read discussions
- No login required for basic access

## 📱 Features Overview

### 📚 Spiritual Library

- **Advanced Search**: Full-text search with Hindi keyword support
- **Book Management**: CRUD operations for spiritual literature
- **Content Organization**: Categorized spiritual content
- **Mobile Optimized**: Responsive reading experience

### 💬 Discussion Platform

- **Q&A Format**: Quora-style question and answer system
- **Search Functionality**: Find discussions by content or keywords
- **Social Features**: Upvoting, sharing, and community interaction
- **Moderation Tools**: Lock discussions, edit content

### 📅 Meeting Management

- **Role-Based Scheduling**: Assign meetings to specific user roles
- **Location Support**: Physical and virtual meeting options
- **Status Tracking**: Scheduled, completed, cancelled states
- **Notification System**: Automatic meeting reminders

### 🔔 Notification System

- **Real-Time Updates**: New content and meeting notifications
- **User-Specific**: Personalized notification feeds
- **Bell Icon**: Header notification badge with unread count
- **Email Integration**: OTP and meeting notifications via email

## 🛠️ Development

### Project Structure

```
RSSB/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Auth & validation
│   ├── prisma/             # Database schema & migrations
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── contexts/       # React contexts
│   │   └── App.tsx
│   └── package.json
└── package.json           # Root package.json
```

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Start React dev server
npm run dev:backend      # Start Node.js dev server

# Building
npm run build           # Build for production
npm run build:frontend  # Build React app
npm run build:backend   # Build Node.js app

# Database
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed initial data
npm run db:reset        # Reset database
```

### API Endpoints

#### Authentication

```http
POST /api/users/generate-otp    # Generate login OTP
POST /api/users/verify-otp      # Verify OTP & login
```

#### Content Management

```http
GET    /api/content/books       # List books
POST   /api/content/books       # Create book (Admin/Mentor)
PUT    /api/content/books/:id   # Update book
DELETE /api/content/books/:id   # Delete book
GET    /api/content/search      # Search content
```

#### Discussions

```http
GET    /api/threads             # List discussions
POST   /api/threads             # Create discussion
GET    /api/threads/:id         # Get discussion
POST   /api/threads/:id/comments # Add comment
```

#### Meetings

```http
GET    /api/meetings            # List meetings
POST   /api/meetings            # Schedule meeting
PUT    /api/meetings/:id        # Update meeting
DELETE /api/meetings/:id        # Cancel meeting
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **OTP Verification**: Email-based login verification
- **Role-Based Access**: Granular permission system
- **Input Validation**: Comprehensive data validation
- **CORS Protection**: Cross-origin request security
- **Helmet.js**: Security headers middleware

## 🎨 UI/UX Design

### Design System

- **Color Palette**: Red primary (`#dc2626`) with spiritual aesthetics
- **Typography**: Clean, readable fonts optimized for content
- **Icons**: Heroicons for consistent iconography
- **Spacing**: Tailwind's systematic spacing scale

### Responsive Design

- **Mobile-First**: Optimized for mobile usage
- **Tablet Support**: Adapted layouts for tablet screens
- **Desktop Experience**: Full-featured desktop interface
- **Touch-Friendly**: Large touch targets for mobile

### Accessibility

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Semantic HTML structure
- **Color Contrast**: WCAG compliant color ratios
- **Focus Management**: Clear focus indicators

## 🚀 Deployment

### Environment Setup

1. **Production Database**: PostgreSQL with connection pooling
2. **Email Service**: SMTP configuration for notifications
3. **Environment Variables**: Secure secret management
4. **SSL Certificate**: HTTPS for secure communication

### Build Process

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Docker Support (Optional)

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Database Schema

### Key Models

- **Users**: Authentication and role management
- **Books**: Spiritual literature content
- **Threads**: Discussion questions
- **Comments**: Discussion answers
- **Meetings**: Scheduled gatherings
- **Notifications**: User notifications

### Relationships

- Users have roles and can create content
- Threads have many comments (answers)
- Meetings target specific user roles
- Notifications are user-specific or global

## 🤝 Contributing

We welcome contributions to improve the RSSB platform! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Standards

- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Radha Soami Satsang Beas** for spiritual guidance and inspiration
- **Open Source Community** for the amazing tools and libraries
- **Contributors** who help improve this platform

## 📞 Support & Contact

For technical support or spiritual guidance:

- **GitHub Issues**: [Report bugs or request features](https://github.com/Vaibhav0126/RSSB/issues)
- **Email**: rssbsearch@gmail.com
- **Community**: Join our spiritual discussions within the platform

---
