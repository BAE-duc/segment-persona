# Technology Stack

## Core Technologies
- **React 18.3.1** - Main UI framework with React.StrictMode (안전한 LTS 버전)
- **TypeScript 5.8.2** - Type safety with ES2022 target
- **Vite 6.2.0** - Build tool and development server
- **D3.js 7.9.0** - Data visualization library for charts and graphs
- **React Router DOM 6.28.0** - Client-side routing (안정적인 v6 버전)

## Build System
- **Vite** configuration with React plugin
- **TypeScript** with experimental decorators enabled
- **Path aliases**: `@/*` maps to workspace root
- **Environment variables**: `GEMINI_API_KEY` for AI integration
- **GitHub Pages** deployment via `gh-pages` package

## Development Setup
```bash
# Install dependencies
npm install

# Start development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Code Style & Patterns
- **Functional Components** with hooks (useState, useRef, useEffect)
- **TypeScript interfaces** for prop definitions
- **Tailwind CSS** for styling with utility classes
- **Component composition** with shared UI components in `/components/shared/`
- **Custom hooks** for complex state management (drag & drop, popup management)

## Architecture Patterns
- **Modal/Popup Management**: Complex z-index stacking with drag-and-drop positioning
- **Event-driven**: Custom events for cross-component communication
- **State Management**: Local component state with useRef for performance-critical operations
- **File Organization**: Feature-based component structure with shared utilities

## Environment Configuration
- Base path: `/i-map/` for GitHub Pages deployment
- Server host: `0.0.0.0` for development
- API integration ready for Gemini AI services