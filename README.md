# MasterNote - AI Task Management System

MasterNote is a web-based task management system with AI assistance, designed to help you organize and manage tasks efficiently.

## Features

- AI-powered task creation and management
- Natural language processing for task dates and priorities
- Clean, modern UI built with Mantine components
- Multi-AI provider support (OpenAI, Claude, Gemini)
- Task organization with priorities and due dates
- Status tracking (Todo, In Progress, Done)

## New Feature: Supabase Integration

MasterNote now supports Supabase for cloud storage and authentication, allowing you to:
- Access your data across multiple devices
- Create user accounts with secure authentication
- Store API keys and tasks in the cloud
- Synchronize tasks automatically

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up for a free account
2. Create a new project
3. Take note of your:
   - Supabase URL (`https://[project-id].supabase.co`)
   - Supabase anon key (public API key)

### 2. Set Up the Database

1. In your Supabase project, go to the SQL Editor
2. Copy the contents of `supabase/setup.sql` from this repository
3. Paste and run the SQL in the Supabase SQL Editor
4. This will create all necessary tables with proper security rules

### 3. Configure Authentication

1. In your Supabase dashboard, go to Authentication → Settings
2. Make sure "Email auth" is enabled
3. Configure any additional auth providers as needed

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env.local`
2. Add your Supabase URL and anon key:
   ```
   VITE_SUPABASE_URL=https://[your-project-id].supabase.co
   VITE_SUPABASE_ANON_KEY=[your-anon-key]
   ```
3. Add your API keys for AI services (optional)

### 5. Run the Application

```bash
npm install
npm run dev
```

## Using the Application with Supabase

1. When you first start the application, you'll see a login/signup screen
2. Create an account or log in
3. Your data will automatically sync between devices when you're logged in
4. If you've used the application before with localStorage, your data will be migrated to Supabase on first login

## Free Tier Limitations

The Supabase free tier includes:
- 500MB database storage
- 1GB file storage
- 50MB database egress
- Unlimited API requests
- 2 free projects

These limits should be more than sufficient for personal use of MasterNote.

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