# Bajeti v2 Documentation

A modern budgeting and financial management application built with Next.js and Supabase.

## Documentation Index

### Product Documentation

- [Non-Technical Overview](./product/non-technical-overview.md) - High-level explanation of Bajeti
- [User Flows](./product/user-flows.md) - Core user journeys through the application
- [Features Roadmap](./product/features-roadmap.md) - Planned features and development timeline
- [Wireframes](./product/wireframes.md) - UI design references and principles

### Technical Documentation

- [Architecture](./technical/architecture.md) - System overview and component structure
- [Database Schema](./technical/database-schema.md) - PostgreSQL database design
- [API Design](./technical/api-design.md) - API structure, endpoints, and implementation patterns
- [Supabase Setup](./technical/supabase-setup.md) - Backend configuration and setup details

### UX Documentation

- [User Personas](./ux/personas.md) - Target user profiles and needs
- [AI Conversational UI](./ux/ai-conversational-ui.md) - Natural language interface design
- [Voice Assistant Plan](./ux/voice-assistant-plan.md) - Voice interface implementation strategy

## Project Structure

```
/
├── web/                  ← Next.js frontend
│   └── src/              ← Source code lives here
│       ├── app/          ← App Router pages and layouts
│       ├── components/   ← Shared UI components
│       ├── lib/          ← Utility functions and Supabase config
│       └── styles/       ← Tailwind/global styles
├── backend/              ← Backend folder (Supabase edge functions, etc.)
├── docs/                 ← Planning, specs, research, designs
    ├── product/          ← Product documentation
    ├── technical/        ← Technical documentation
    └── ux/               ← User experience documentation
```

## Getting Started

See the main [README.md](../README.md) at the project root for setup instructions.

### Frontend Development

```bash
# Navigate to the web directory
cd web

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Technologies

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Authentication, Database, Storage)
- **Styling**: Tailwind CSS, Shadcn UI components

## License

[MIT](LICENSE)
