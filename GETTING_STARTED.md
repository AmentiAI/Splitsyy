# Getting Started with Splitsy Development

This guide will help you get the Splitsy application running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or later
- **npm** or **yarn** or **pnpm**
- **Git** for version control

## Quick Start

### 1. Install Dependencies

All dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

### 2. Configure Environment Variables

The project includes a `.env.example` file with all required variables. You'll need to:

1. **Set up a Supabase project** (Phase 2):
   - Go to https://supabase.com
   - Create a new project
   - Copy your project URL and anon key

2. **Set up Stripe** (Phase 5):
   - Go to https://stripe.com
   - Get your test API keys
   - Configure webhook secrets

3. **Set up monitoring tools** (Phase 9):
   - PostHog for analytics
   - Sentry for error tracking

For now, you can run the development server without these configured.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The page will automatically reload when you make changes.

## Available Commands

### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
```

### Code Quality
```bash
npm run lint             # Check code with ESLint
npm run format           # Format code with Prettier
npm run format:check     # Check if code is formatted
npm run type-check       # Check TypeScript types
```

### Testing
```bash
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:e2e         # Run end-to-end tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:install # Install Playwright browsers
```

## Project Structure Overview

```
├── app/                # Next.js App Router
│   ├── api/           # API routes
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page
├── components/        # React components
├── lib/               # Utility functions and configs
│   ├── supabase/     # Database clients
│   ├── stripe/       # Payment integration
│   └── validations/  # Zod schemas
├── types/            # TypeScript definitions
├── tests/            # Unit and E2E tests
└── supabase/         # Database migrations
```

## Development Workflow

### Making Changes

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the appropriate directory

3. Test your changes:
   ```bash
   npm run build
   npm run lint
   npm run type-check
   ```

4. Commit your changes (pre-commit hooks will run automatically):
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

### Code Standards

- **TypeScript**: Use strict typing, avoid `any`
- **Components**: Functional components with TypeScript
- **Styling**: Use TailwindCSS utility classes
- **Validation**: Use Zod schemas for all inputs
- **Formatting**: Prettier will auto-format on commit

## Next Steps

### Phase 2: Database Setup (Next)

To continue development, you'll need to:

1. **Create a Supabase account**
   - Visit https://supabase.com
   - Create a new project
   - Note your project URL and keys

2. **Set up the database schema**
   - Run migrations for users, groups, pools, etc.
   - Configure Row-Level Security policies

3. **Update environment variables**
   - Add Supabase credentials to `.env.local`

4. **Test the connection**
   - Verify Supabase client can connect
   - Test authentication flows

## Troubleshooting

### Build Issues

If you encounter build errors:

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Type Errors

If you see TypeScript errors:

```bash
# Check types
npm run type-check

# Look for missing dependencies
npm install
```

### Module Not Found

If you see "Cannot find module" errors:

```bash
# Ensure all dependencies are installed
npm install

# Check your tsconfig.json paths
cat tsconfig.json
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## Support

For questions or issues:
1. Check the README.md for detailed documentation
2. Review the technical specification
3. Check PHASE1_COMPLETE.md for setup verification

---

Happy coding! 🚀

