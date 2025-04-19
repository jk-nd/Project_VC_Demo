# Project VC Demo - Frontend

This is the frontend application for the Project VC Demo, built with React, TypeScript, and Vite. It provides a user interface for managing IOUs (I Owe You) between users.

## Key Features

- **Search with Autocomplete**: Search IOUs by issuer, payee, state, or amount with type-ahead suggestions
- **IOU Management**: Create, pay, and forgive IOUs with a modern UI
- **Real-time Updates**: See changes immediately after actions are taken
- **Responsive Design**: Works on desktop and mobile devices
- **User Authentication**: Secure login with Keycloak integration

## Technology Stack

- **React 18**: UI library with hooks and context API
- **TypeScript**: Type safety and improved developer experience
- **Vite**: Fast build tool and development server
- **Material UI v5**: Modern component library for consistent design
- **MUI X DataGrid**: For displaying IOU tables with sorting and pagination
- **Axios**: HTTP client for API requests
- **Keycloak**: Authentication integration

## Directory Structure

```
frontend/
├── public/          # Static assets
├── src/
│   ├── auth/        # Authentication related code
│   ├── components/  # React components
│   │   ├── iou/     # IOU-specific components
│   │   │   ├── CreateIOU.tsx       # Create new IOUs
│   │   │   ├── IOUTable.tsx        # Main IOU listing with search
│   │   │   ├── PayIOUScreen.tsx    # Interface for paying IOUs
│   │   │   └── ForgiveIOUScreen.tsx # Interface for forgiving IOUs
│   │   └── layout/  # Layout components
│   ├── contexts/    # React contexts
│   ├── hooks/       # Custom React hooks
│   ├── types/       # TypeScript interfaces and types
│   ├── services/    # API services
│   │   ├── api.ts          # Base API configuration with Axios
│   │   └── iouService.ts   # IOU-related API calls
│   └── utils/       # Utility functions
│       └── formatters.ts   # Formatting helpers for currency, dates, etc.
├── vite.config.ts   # Vite configuration
└── tsconfig.json    # TypeScript configuration
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5173

## IOU Components

The application includes several specialized components for IOU management:

### IOUTable
The main component displaying all IOUs with powerful search functionality:
- Autocomplete search with type-ahead suggestions
- Search by various criteria (issuer, payee, state, amount)
- Filtering based on search terms
- Sortable and paginated table view

### CreateIOU
Form for creating new IOUs with:
- Recipient selection
- Amount input with validation
- Description field

### PayIOUScreen
Interface for making payments against IOUs:
- Amount input with validation
- Shows maximum amount that can be paid
- Confirmation dialog

### ForgiveIOUScreen
Interface for forgiving IOUs:
- Shows IOUs where the current user is the payee
- Confirmation dialog before forgiving

## API Integration

The frontend communicates with the NPL backend through API services defined in `src/services/`.

Key services include:
- `api.ts`: Base API configuration with Axios
- `iouService.ts`: IOU-related API calls (createIOU, fetchUserIOUs, payIOU, getIOU)
- `userService.ts`: User-related API calls

## Authentication

Authentication is handled through a Keycloak integration:
- Login/logout functionality
- Token management
- User information retrieval
- Protected routes

## Proxy Configuration

The Vite development server is configured to proxy API requests to avoid CORS issues:

- API requests (`/backend/*`) are proxied to the NPL engine (http://localhost:12000)
- Authentication requests (`/auth/*`) are proxied to Keycloak (http://localhost:80)

## Build for Production

```bash
npm run build
```

This generates optimized assets in the `dist/` directory that can be served by any static file server.

## Additional Commands

- `npm run lint`: Run ESLint to check for code issues
- `npm run preview`: Preview the production build locally

For more details about the overall project architecture and backend setup, refer to the main [README.md](../README.md) file at the root of the repository.
