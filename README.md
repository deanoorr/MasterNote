# MasterNote - AI Task Management System

MasterNote is a web-based task management system with AI assistance, designed to help you organize and manage tasks efficiently.

## Features

- AI-powered task creation and management
- Natural language processing for task dates and priorities
- Clean, modern UI built with Mantine components
- Multi-AI provider support (OpenAI, Claude, Gemini)
- Task organization with priorities and due dates
- Status tracking (Todo, In Progress, Done)

## Development

### Prerequisites

- Node.js (v18 or newer recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/masternote.git
cd masternote

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at http://localhost:3000

### Building for Production

```bash
# Build the web application
npm run build

# Preview the production build
npm run preview
```

## Deployment to Vercel

MasterNote can be easily deployed to Vercel following these steps:

### Method 1: Using Vercel CLI

1. Install the Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   # For a preview deployment
   npm run deploy:preview
   
   # For a production deployment
   npm run deploy
   ```

3. Follow the prompts to log in and configure your deployment.

### Method 2: Directly from GitHub

1. Push your MasterNote project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and sign up/log in.
3. Click "New Project" and import your GitHub repository.
4. Configure the project with the following settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Configure environment variables in the Vercel dashboard:
   - Add all your API keys (VITE_OPENAI_API_KEY, etc.)
6. Deploy the project.

### Custom Domain

To use a custom domain:
1. Go to your project on Vercel dashboard
2. Navigate to "Settings" > "Domains"
3. Add your domain and follow the instructions to set it up

## Technology Stack

- React with TypeScript
- Vite for fast development and building
- Mantine UI components
- Zustand for state management
- OpenAI, Claude, and Gemini API integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 