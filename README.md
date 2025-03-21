# MasterNote

MasterNote is a modern task management application with integrated AI assistance. It combines a clean, intuitive interface with powerful AI features to help you organize tasks, set priorities, and manage deadlines effectively.

## Features

- **AI-Powered Task Management**: Create and manage tasks with natural language processing
- **Multiple AI Models**: Choose between different AI models including GPT-4o, GPT-3.5 Turbo, and Perplexity Sonar
- **Web Search Capability**: Access internet information via Perplexity Sonar to get up-to-date data
- **Visual Task Organization**: Clean, visually appealing interface with priority indicators and status tracking
- **Due Date Management**: Set and track task deadlines with intuitive date selection
- **Dark/Light Mode**: Choose between dark and light themes for optimal viewing comfort

## Technology Stack

- React with TypeScript
- Mantine UI Component Library
- OpenAI API Integration
- Perplexity API Integration
- Zustand for State Management
- Vite for Fast Development

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- OpenAI API key
- (Optional) Perplexity API key for web search capabilities

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/deanoorr/MasterNote.git
   cd MasterNote
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create an `.env` file in the root directory based on `.env.example` and add your API keys:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000` (or the port shown in your terminal)

## Usage

1. **Create Tasks**: Type natural language instructions in the AI chat like "Add a task to review the report by Friday"
2. **Manage Tasks**: Set priorities, deadlines, and mark tasks as complete
3. **Ask Questions**: When using Perplexity Sonar model, you can ask general questions that require web search
4. **Customize Settings**: Set your API keys and preferences in the settings menu

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for their powerful language models
- Perplexity for their search-enabled AI models
- Mantine team for the excellent UI library 