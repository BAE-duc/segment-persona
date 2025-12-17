# Project Structure

## Root Level
- **App.tsx** - Main application entry point, renders MainLayout
- **index.tsx** - React DOM root with StrictMode wrapper
- **index.html** - HTML template with root div
- **vite.config.ts** - Vite configuration with React plugin and path aliases
- **tsconfig.json** - TypeScript configuration with ES2022 target
- **package.json** - Dependencies and build scripts

## Component Organization

### `/components/` - Main UI Components
- **MainLayout.tsx** - Primary layout with header, sidebar, and popup management
- **MainContent.tsx** - Central content area (currently minimal)
- **Sidebar.tsx** - Navigation and analysis controls
- **TabSystem.tsx** - Reusable tabbed interface for popups

### `/components/shared/` - Reusable UI Components
- **FormControls.tsx** - AppButton, AppSelect with consistent styling
- **modalStyles.ts** - Shared modal styling constants
- **TreeItem.tsx** - Hierarchical data display
- **FilterSection.tsx** - Data filtering interface
- **ErrorModal.tsx**, **InfoModal.tsx**, **WarningModal.tsx** - User feedback modals

### `/pages/` - Page-Level Components
- **SegmentCreationPage.tsx** - Segment analysis interface
- **PersonaListPage.tsx** - Persona management and display
- **PersonaDetailPage.tsx** - Individual persona analysis

### `/data/` - Static Assets and Test Data
- **testData.ts** - CSV data for development and testing
- **persona_*.png** - Persona image assets
- **hitmap.png**, **positioningmap.png**, **sommap.png** - Visualization assets

### `/scripts/` - Data Processing Utilities
- Python and JavaScript scripts for data manipulation
- Car image and column addition utilities

## Naming Conventions
- **PascalCase** for React components and TypeScript interfaces
- **camelCase** for functions, variables, and file utilities
- **kebab-case** for asset files and images
- **Japanese comments** in code for business logic explanations

## File Patterns
- Components export as named exports: `export const ComponentName`
- Interfaces defined inline or at component level
- Utility functions in separate `.ts` files
- Assets organized by type in `/data/` folder

## State Management Patterns
- Complex popup state managed in MainLayout with useRef for performance
- Drag-and-drop positioning with mouse event handlers
- Z-index management through popup stack arrays
- Custom event dispatching for cross-component communication