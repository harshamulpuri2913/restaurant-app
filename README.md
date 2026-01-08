# 🍽️ Sai Datta Snacks & Savories - Restaurant App

A modern, full-stack restaurant ordering application with WhatsApp integration, built with Next.js 14, TypeScript, PostgreSQL, and Prisma.

## ✨ Features

- 🔐 **User Authentication** - Secure sign-in/sign-up with email verification
- 🍽️ **Menu Display** - Beautiful, responsive menu with product categories
- 🛒 **Shopping Cart** - Persistent cart with localStorage
- 📦 **Order Management** - Complete order lifecycle (pending → processing → completed)
- 📱 **WhatsApp Integration** - Automatic order notifications to admin
- 📊 **Admin Dashboard** - Comprehensive admin panel with:
  - Order management and status updates
  - Product management (CRUD operations)
  - Earnings & spending reports
  - Inventory management
  - Excel export functionality
- 📥 **Excel Export** - Export orders and earnings reports
- 🎨 **Modern UI** - Responsive design for mobile, tablet, and desktop
- ⚡ **Performance Optimized** - Lazy loading, code splitting, pagination

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **WhatsApp**: Twilio or Meta WhatsApp Business API
- **Export**: Excel (XLSX) format

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd "Restaurant app"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials (see [Environment Variables](#-environment-variables) section).

### 4. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

### 5. Seed Database (Optional)

Visit `http://localhost:3000/api/seed` in your browser after starting the server to create:
- Admin user
- Sample products

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## 🔐 Environment Variables

See `.env.example` for a complete template. Required variables:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your application URL
- `NEXTAUTH_SECRET` - Secret key (generate with `openssl rand -base64 32`)
- `ADMIN_EMAIL` - Initial admin email
- `ADMIN_PASSWORD` - Initial admin password

### Optional
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `RESEND_API_KEY` - For email verification
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` - For WhatsApp via Twilio
- `WHATSAPP_API_KEY` - For WhatsApp via Meta Business API

**⚠️ IMPORTANT**: Never commit `.env` files to Git! See [SECURITY.md](./SECURITY.md) for security guidelines.

## 📁 Project Structure

```
Restaurant app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── checkout/          # Checkout page
│   ├── orders/            # User orders page
│   └── menu/              # Menu page
├── components/            # React components
│   ├── menu/             # Menu-specific components
│   └── admin/            # Admin-specific components
├── lib/                   # Utility libraries
├── prisma/                # Database schema
└── public/                # Static assets
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## 🔒 Security

- ✅ All secrets stored in environment variables
- ✅ API routes protected with authentication
- ✅ Admin routes require admin role
- ✅ Input validation on all forms
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (React)
- ✅ Security headers configured

See [SECURITY.md](./SECURITY.md) for comprehensive security guidelines.

## 📱 Responsive Design

The application is fully responsive and optimized for:
- 📱 **Mobile** (< 640px)
- 📱 **Tablet** (640px - 1024px)
- 💻 **Desktop** (1024px+)
- 📺 **Large Screens/TV** (1920px+)

## 🚀 Deployment

### Recommended Platforms

1. **Vercel** (Recommended for Next.js)
   - Automatic deployments from Git
   - Built-in environment variable management
   - Free tier available

2. **Netlify**
   - Good Next.js support
   - Easy setup

3. **Self-hosted**
   - Docker + VPS
   - Full control

### Deployment Steps

1. Set all environment variables in your hosting platform
2. Configure database connection
3. Run database migrations: `npm run db:push`
4. Deploy application
5. Verify all features work

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture documentation
- [SECURITY.md](./SECURITY.md) - Security guidelines and best practices
- [ENV_TEMPLATE.md](./ENV_TEMPLATE.md) - Environment variables guide

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

Private - All rights reserved

## 🆘 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for Sai Datta Snacks & Savories**
