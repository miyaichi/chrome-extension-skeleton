# Chrome Extension Skeleton

A Chrome Extension skeleton project with TypeScript, React, and TailwindCSS, featuring background service worker, content scripts, and side panel implementation.

## Features

- **Type-safe messaging system** between background, content scripts, and side panel
- **React-based side panel** with TailwindCSS styling
- **Robust connection management** between extension components
- **TypeScript** for enhanced development experience
- **Webpack** for building and bundling
- **Hot reload** support during development

## Architecture

The extension consists of three main components:

1. **Background Service Worker**
   - Monitors tab and window changes
   - Handles tab ID requests from content scripts
   - Notifies side panel of active tab changes

2. **Content Script**
   - Retrieves its own tab ID on initialization
   - Establishes persistent connection with proper tab ID
   - Communicates with background and side panel

3. **Side Panel**
   - React-based user interface
   - Manages active tab information
   - Handles extension-wide communication

## Getting Started

### Prerequisites

- Node.js (14.0.0 or later)
- npm (6.0.0 or later)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd chrome-extension-skeleton
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from the project

### Development

For development with hot reload:
```bash
npm run watch
```

## Project Structure

```
├── public/
│   ├── manifest.json
│   ├── sidepanel.html
│   └── icons/
├── src/
│   ├── assets/
|   |  └── icons/
│   ├── background/
│   │   └── background.ts
│   ├── contentScript/
│   │   └── contentScript.ts
│   ├── sidepanel/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── styles/
│   │   └── global.css
│   ├── types/
│   │   ├── messages.ts
│   │   └── types.ts
│   └── utils/
│       ├── connectionManager.ts
│       └── logger.ts
├── package.json
├── webpack.config.js
├── tsconfig.json
├── postcss.config.js
└── tailwind.config.js
```

## Built With

- [TypeScript](https://www.typescriptlang.org/) - Programming language
- [React](https://reactjs.org/) - UI library
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Webpack](https://webpack.js.org/) - Module bundler

## Connection Management

The extension implements a robust connection management system using the `ConnectionManager` class, which handles:

- Secure message passing between components
- Automatic reconnection with exponential backoff
- Error handling and logging
- Type-safe message interfaces

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Chrome Extensions API Documentation
- React Documentation
- TypeScript Documentation