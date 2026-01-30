# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma generate  # Generate Prisma client (runs automatically on npm install)
npx prisma migrate dev  # Run database migrations in development
```

## Tech Stack

- **Framework**: Next.js 14.2 (App Router with Server Components)
- **Database**: PostgreSQL with Prisma ORM 7.1
- **Auth**: NextAuth.js 5 (beta) with Credentials provider, JWT sessions
- **UI**: Tailwind CSS, Radix UI primitives, Shadcn/ui components
- **Validation**: Zod schemas
- **File Storage**: AWS S3
- **Email**: Resend

## Architecture

### Server Actions Pattern
All database mutations go through server actions in `src/actions/`. Actions:
- Are organized by feature (e.g., `product/product/`, `product/product-receipt/`)
- Return form state objects with `fieldErrors` for validation feedback
- Use Zod schemas from `src/zod/` for validation
- Handle Prisma errors and return user-friendly messages

### Authentication & Authorization
- Middleware in `src/middleware.ts` protects all routes except API, static files, and public pages
- User roles: `ADMIN`, `USER` (defined in Prisma schema)
- Admin routes under `/admin/*` require ADMIN role
- Session includes role via custom NextAuth callbacks in `src/auth.config.ts`

### Database Access
- Singleton Prisma client in `src/db/index.ts` with connection pooling
- Always import from `@/db` for database access

### Component Organization
- `src/components/ui/` - Shadcn/ui primitives (don't modify directly)
- `src/components/admin/` - Admin panel components
- `src/components/common/` - Shared components
- `src/components/providers/` - React context providers

### Type Augmentation
- NextAuth types extended in `src/types/next-auth.d.ts` to include user role
- Product-related types in `src/types/product/`

## Key Patterns

### Form Handling
Forms use FormData with server actions. Pattern:
1. Define Zod schema in `src/zod/`
2. Create form state type with `fieldErrors`
3. Server action validates with Zod, returns errors or redirects on success
4. Client displays errors from form state

### Path Aliases
Use `@/*` for imports from `src/` directory (configured in tsconfig.json)

## Language
Application UI and validation messages are in **Russian**.
