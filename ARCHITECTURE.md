# Architecture Documentation

## 📁 Project Structure

```
Restaurant app/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── orders/               # Order management
│   │   ├── products/             # Product management
│   │   └── invested-items/       # Inventory management
│   ├── admin/                    # Admin pages
│   │   ├── page.tsx              # Admin dashboard
│   │   ├── products/             # Product management
│   │   ├── earnings/             # Earnings reports
│   │   └── invested-items/       # Inventory
│   ├── checkout/                 # Checkout page
│   ├── orders/                   # User orders page
│   ├── menu/                     # Menu page (redirects to /)
│   ├── signin/                   # Sign in page
│   ├── signup/                   # Sign up page
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── menu/                     # Menu-specific components
│   │   ├── ProductCard.tsx       # Individual product card
│   │   ├── CategorySection.tsx  # Category section
│   │   └── CartModal.tsx         # Shopping cart modal
│   ├── admin/                    # Admin-specific components
│   │   └── OrderCard.tsx         # Order card component
│   ├── Header.tsx                # Site header
│   ├── Menu.tsx                  # Main menu component
│   ├── ContactFooter.tsx         # Footer component
│   └── ProductTooltip.tsx        # Product tooltip
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client
│   ├── email.ts                  # Email utilities
│   ├── whatsapp.ts               # WhatsApp integration
│   └── invested-items-utils.ts   # Inventory utilities
├── prisma/                       # Database schema
│   └── schema.prisma             # Prisma schema
├── types/                        # TypeScript types
│   └── next-auth.d.ts           # NextAuth type definitions
├── public/                       # Static assets
│   └── uploads/                  # User-uploaded files
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── next.config.js                # Next.js configuration
├── package.json                   # Dependencies
└── SECURITY.md                   # Security guidelines
```

## 🏗️ Architecture Principles

### 1. Component Organization
- **Page Components**: Located in `app/` directory (Next.js App Router)
- **Reusable Components**: Located in `components/` directory
- **Feature-Specific Components**: Grouped in subdirectories (e.g., `components/menu/`)

### 2. Code Splitting & Lazy Loading
- Heavy components are lazy-loaded using `next/dynamic`
- Route-based code splitting (automatic with Next.js)
- Component-level code splitting for better performance

### 3. API Routes
- All API routes in `app/api/` directory
- RESTful naming conventions
- Proper error handling and validation
- Authentication checks on protected routes

### 4. State Management
- React hooks (`useState`, `useEffect`) for local state
- `localStorage` for client-side persistence (cart)
- Server-side state via API calls

### 5. Database
- Prisma ORM for type-safe database access
- PostgreSQL for production scalability
- Migrations managed via Prisma

## 🔄 Data Flow

### User Order Flow
1. User browses menu (`/menu`)
2. Adds items to cart (stored in `localStorage`)
3. Proceeds to checkout (`/checkout`)
4. Submits order → API call to `/api/orders`
5. Order created in database
6. WhatsApp notification sent to admin
7. User redirected to orders page

### Admin Flow
1. Admin views dashboard (`/admin`)
2. Sees pending orders
3. Confirms order → Status changes to "processing"
4. Updates order details (timeline, notes)
5. Marks as completed → Status changes to "completed"
6. Marks payment received → Payment status updated

## 🚀 Performance Optimizations

### Implemented
- ✅ Lazy loading for heavy components
- ✅ Image optimization (Next.js Image component)
- ✅ Code splitting (automatic with Next.js)
- ✅ Pagination for large lists
- ✅ Memoization where appropriate
- ✅ Optimized bundle size

### Future Improvements
- [ ] Service Worker for offline support
- [ ] Redis caching for frequently accessed data
- [ ] CDN for static assets
- [ ] Database query optimization
- [ ] API response caching

## 🔐 Security Measures

### Implemented
- ✅ Environment variables for all secrets
- ✅ API route authentication
- ✅ Admin route protection
- ✅ Input validation
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (React)
- ✅ CSRF protection (NextAuth)
- ✅ Security headers (next.config.js)

### Best Practices
- Never commit `.env` files
- Use strong passwords
- Rotate secrets regularly
- Enable HTTPS in production
- Regular security audits

## 📱 Responsive Design

### Breakpoints
- Mobile: < 640px (base styles)
- Tablet: 640px - 1024px (`sm:`, `md:`)
- Desktop: 1024px+ (`lg:`, `xl:`)
- Large screens/TV: 1920px+ (`2xl:`)

### Approach
- Mobile-first design
- Flexible layouts (flexbox, grid)
- Responsive typography
- Touch-friendly buttons
- Optimized for all screen sizes

## 🧪 Testing Strategy

### Recommended
- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical flows
- Performance testing
- Security testing

## 📦 Deployment

### Recommended Platforms
- **Vercel**: Easiest Next.js deployment
- **Netlify**: Good alternative
- **AWS Amplify**: Enterprise option
- **Self-hosted**: Docker + VPS

### Environment Setup
1. Set all environment variables in hosting platform
2. Configure database connection
3. Run database migrations
4. Deploy application
5. Verify all features work

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use functional components
- Prefer hooks over class components
- Consistent naming conventions

### Git Workflow
- Feature branches for new features
- Descriptive commit messages
- Code reviews before merging
- Never commit secrets
- Keep commits focused and atomic

