# Architecture

## System Overview

Bajeti v2 follows a modern full-stack architecture with a clear separation of concerns:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Next.js        │◄────►│  Supabase       │◄────►│  Edge Functions │
│  Frontend       │      │  Backend        │      │  & Services     │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Core Components

### Frontend (Next.js)
- **App Router**: Page routing and layouts using React Server Components
- **Client Components**: Interactive UI elements that require client-side JavaScript
- **Server Components**: Static and dynamic server-rendered components
- **API Routes**: Backend functionality exposed via API endpoints
- **Authentication**: Client-side auth handling with Supabase Auth

### Backend (Supabase)
- **PostgreSQL Database**: Primary data storage
- **Authentication**: User management and session handling
- **Storage**: File storage for receipts and attachments
- **Realtime**: Live updates for collaborative features
- **Edge Functions**: Serverless functions for custom logic

### External Services
- **OpenAI**: AI-powered financial insights and assistant
- **Plaid/Teller**: Financial account connections (planned)
- **SendGrid**: Email notifications
- **Stripe**: Payment processing (for premium features)

## Data Flow

1. **Authentication Flow**:
   - User credentials → Supabase Auth → JWT → Client
   - Protected routes check JWT validity

2. **Data Access Flow**:
   - Client request → Server Component/API Route → Supabase SDK → PostgreSQL
   - Row-level security (RLS) enforces access control

3. **Real-time Updates**:
   - Database changes → Supabase Realtime → WebSocket → Client
   - Optimistic UI updates with server validation

## Deployment Architecture

- **Frontend**: Vercel (production, preview environments)
- **Backend**: Supabase (dedicated project)
- **CI/CD**: GitHub Actions for automated testing and deployment

## Security Considerations

- JWT-based authentication
- Row-level security policies
- HTTPS-only communication
- Environment variable isolation
- Regular security audits

## Performance Optimizations

- Edge caching for static content
- Incremental Static Regeneration for semi-dynamic content
- Connection pooling for database queries
- Image optimization and lazy loading
- Code splitting and bundle optimization
