# Project VC Demo - Frontend

This is the frontend application for the Project VC Demo, built with React, TypeScript, and Vite.

## Technology Stack

- **React**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and development server
- **Material UI**: Component library for consistent design
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
│   │   └── layout/  # Layout components
│   ├── contexts/    # React contexts
│   ├── hooks/       # Custom React hooks
│   ├── models/      # TypeScript interfaces and types
│   ├── services/    # API services
│   └── utils/       # Utility functions
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

## API Integration

The frontend communicates with the NPL backend through API services defined in `src/services/`.

Key services include:
- `api.ts`: Base API configuration with Axios
- `authService.ts`: Authentication-related API calls
- `iouService.ts`: IOU-related API calls

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
