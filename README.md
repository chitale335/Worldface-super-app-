# KOTEKULE WD

WorldFace is an open-source digital platform designed to connect people, services, and opportunities globally. Built with React, TypeScript, and Supabase, WorldFace combines social networking, creator tools, AI-powered interactions, and marketplace capabilities into a unified ecosystem.

## About WorldFace

WorldFace is in active development as an experimental platform to explore how modern web technologies can enable global digital connection and community. The project is developed publicly to foster collaboration, transparency, and community contribution.

Currently, WorldFace includes:

- **Social networking** — Feed, messaging, and user profiles
- **Creator tools** — Livestreaming, studio, and music sharing
- **Marketplace** — App store and general marketplace
- **Cultural features** — CulturalVerse hub with heritage preservation, traditional recipes, fashion, music, and cultural mentorship
- **AI assistant** — Voice-enabled AI with support for multiple languages
- **Monetization tools** — Wallet, payouts, payment processing, and ads manager
- **Analytics** — Creator revenue tracking and insights

## Vision

WorldFace aspires to become a globally accessible platform that:

- Bridges digital identity with real-world services and commerce
- Respects and celebrates cultural diversity through dedicated features
- Empowers creators and developers through open APIs and extensibility
- Combines AI capabilities with human connection
- Operates transparently with community input

The long-term roadmap includes features like mobile applications (iOS/Android), expanded payment integrations, blockchain-based identity systems, and advanced AI-powered assistance.

## What is currently available

### Core Features

- **Authentication & Profiles** — User registration, login, and profile management
- **Social Feed** — Post creation, feed discovery, and hashtag exploration
- **Messaging & Notifications** — Real-time messaging and notification system
- **Creator Monetization** — Wallet system, payout requests, and revenue analytics
- **AI Assistant** — Text and voice-based AI conversations in English and Swahili
- **CulturalVerse** — Cultural groups, heritage music, traditional recipes, fashion, learning center, challenges, and family heritage trees
- **Content Sharing** — Livestreaming, video/audio studio, and music sharing
- **Marketplace** — App store and general marketplace for services
- **Ads Manager** — Advertising tools with budget estimation and campaign management

### Technology Stack

- **Frontend** — React 18, TypeScript, Vite, TailwindCSS, Radix UI components
- **Backend** — Supabase (PostgreSQL, Edge Functions, Real-time API)
- **Authentication** — Lovable Cloud Auth
- **State Management** — TanStack React Query
- **Styling** — TailwindCSS with shadcn/ui components
- **Build Tools** — Vite, ESLint, Playwright for testing
- **PWA** — Service worker support with Workbox

## Open-source mission

WorldFace is developed as open-source software to:

- Invite collaboration from developers worldwide
- Foster transparency in how the platform evolves
- Enable community members to build on top of WorldFace
- Share knowledge and best practices with the broader developer community

We welcome contributions of all kinds: bug reports, feature suggestions, documentation improvements, code contributions, and community engagement.

## Getting started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn package manager
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/chitale335/worldface-magic-portals.git
cd worldface-magic-portals
```

2. Install dependencies:

```bash
npm install
```

3. Environment setup:

Create a `.env` file in the project root. You'll need to configure:

- Supabase credentials (URL and key)
- Lovable Cloud Auth credentials
- Any other API keys required for integrations

Refer to the repository configuration files for the complete list of required environment variables.

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:8080`.

### Building for production

```bash
npm run build
```

The output will be in the `dist/` directory.

## Development

### Available scripts

- `npm run dev` — Start development server with hot reload
- `npm run build` — Build for production
- `npm run build:dev` — Build in development mode
- `npm run lint` — Run ESLint
- `npm run preview` — Preview production build locally
- `npm run test` — Run tests once
- `npm run test:watch` — Run tests in watch mode

### Code structure

- `src/pages/` — Page components for each feature area
- `src/components/` — Reusable UI components
- `src/hooks/` — Custom React hooks
- `src/lib/` — Utility functions and helpers
- `src/integrations/` — External service integrations (Supabase, etc.)

### Contributing code

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass and linting is clean
4. Submit a pull request with a clear description of your changes
5. Engage in code review and address feedback
6. Your contribution will be merged once approved

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## Roadmap

### Completed (in active development)

- React + TypeScript + Vite stack
- Supabase integration for backend
- User authentication and profiles
- Social feed and messaging
- CulturalVerse hub and cultural features
- AI assistant with voice capabilities
- Creator monetization and analytics
- Marketplace and app store
- Ads manager
- PWA support

### In progress

- Expanding cultural content and community features
- Enhancing AI assistant capabilities
- Improving monetization options
- Mobile-responsive optimization
- Performance enhancements

### Planned (not yet started)

- Native iOS mobile application
- Native Android mobile application
- Additional payment integrations (M-Pesa, expanded regional support)
- Blockchain-based identity features
- Advanced AI-powered recommendations
- Multi-language interface expansion
- Developer API documentation and SDK

## Contributing

We welcome all types of contributions. Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed information about how to:

- Report bugs
- Suggest features
- Contribute code
- Improve documentation
- Participate in the community

## Security

If you discover a security vulnerability, please report it responsibly using GitHub's private security reporting. See [SECURITY.md](./SECURITY.md) for details.

## Code of Conduct

This project is committed to providing a welcoming and inclusive environment. Please review our [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for community guidelines.

## Sponsorship

WorldFace is maintained by volunteers and developed in the open. If you find value in this project and would like to support its continued development, please consider becoming a GitHub Sponsor.

Your sponsorship helps sustain:

- Ongoing maintenance and bug fixes
- Infrastructure and hosting costs
- Security audits and improvements
- Documentation and tutorials
- Community support and engagement
- Feature development and research

GitHub Sponsors enable the maintainer to dedicate more time to this project. Sponsorships do not grant ownership, guaranteed features, or investment returns — they represent support for open-source development.

## License

WorldFace is distributed under the MIT License. See [LICENSE](./LICENSE) for details.

## Maintainer

**Maintained by:** [chitale335](https://github.com/chitale335)

For questions or general inquiries about the project, please open a GitHub issue or discussion.

---

**Learn more:** Visit the [live demo](https://worldface.lovable.app) (when available) or explore the repository to get started with WorldFace.
