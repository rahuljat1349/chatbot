# AceChat - Rahul's Professional AI Assistant

AceChat is a modern, professional AI assistant built by Rahul Dudi, designed to be embedded in portfolio websites as an intelligent chatbot. It provides information about Rahul's skills, projects, and general assistance while maintaining a polite, professional tone.

## ✨ Features

### 🤖 AI Assistant Capabilities

- **Professional Responses**: Polite, helpful, and informative interactions
- **Personal Information**: Detailed knowledge about Rahul's skills, projects, and contact information
- **General Assistance**: Helpful responses to various topics and queries
- **Multi-language Support**: Fluent in English and Hindi
- **Real-time Streaming**: Instant, responsive chat experience

### 🎨 Modern UI/UX

- **Dark Mode Design**: Professional dark theme with accent colors
- **Responsive Layout**: Optimized for iframe embedding (400px × 600px)
- **Smooth Animations**: Polished transitions and hover effects
- **Mobile-Friendly**: Works seamlessly on all device sizes
- **Professional Styling**: Clean, modern interface with rounded corners

### 🔧 Smart Features

- **Example Questions**: Pre-loaded starter questions for easy interaction
- **Code Copying**: One-click copy functionality for code blocks
- **Minimize/Close**: Floating chat window with minimize and close options
- **Auto-scroll**: Automatic scrolling to latest messages
- **Loading States**: Visual feedback during AI processing

### 🔐 Simple Authentication

- **Get Started Flow**: No complex login/signup - just enter your email to begin
- **Email Required**: Valid email address is mandatory for access
- **Auto-Create Account**: New users are automatically registered
- **Session Management**: Seamless experience with persistent sessions
- **Professional Welcome**: Clean, branded authentication interface

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project
- Mistral AI API key

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd chatbot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**

   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Run the SQL schema in your Supabase SQL editor (see `supabase-schema.sql`)

4. **Set up environment variables**
   Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   MISTRAL_API_KEY=your_mistral_api_key
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Iframe Integration

AceChat is designed to be embedded in portfolio websites. Here's how to integrate it:

### Basic Integration

```html
<iframe
  src="https://your-acechat-domain.com"
  width="400"
  height="600"
  style="border: none; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);"
  title="AceChat - Rahul's AI Assistant"
></iframe>
```

### Responsive Integration

```html
<div style="max-width: 400px; margin: 0 auto;">
  <iframe
    src="https://your-acechat-domain.com"
    width="100%"
    height="600"
    style="border: none; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);"
    title="AceChat - Rahul's AI Assistant"
  ></iframe>
</div>
```

### Floating Chat Widget

```html
<div
  id="acechat-widget"
  style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;"
>
  <iframe
    src="https://your-acechat-domain.com"
    width="375"
    height="600"
    style="border: none; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);"
    title="AceChat - Rahul's AI Assistant"
  ></iframe>
</div>
```

## 🛠️ Customization

### Updating Personal Information

Edit `src/lib/prompt.ts` to update:

- Personal details and contact information
- Skills and technologies
- Project descriptions
- Response behavior and tone

### Styling Customization

- **Colors**: Modify CSS variables in `src/app/globals.css`
- **Layout**: Adjust dimensions in `src/app/page.tsx`
- **Animations**: Customize transition effects and timing

### Example Questions

Update the example questions in `src/app/page.tsx`:

```typescript
const exampleQuestions = [
  "Tell me about Rahul's AI projects",
  "What are Rahul's technical skills?",
  "How can I contact Rahul?",
  "What is Rahul's experience with LangChain?",
];
```

### Authentication Customization

- **Welcome Message**: Update the welcome text in `src/app/signin/page.tsx`
- **Email Validation**: Modify validation rules in `src/app/api/signin/route.ts`
- **UI Styling**: Customize the authentication page appearance

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Custom CSS
- **AI**: LangChain, Mistral AI
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (recommended)

### Key Components

- `src/app/page.tsx` - Main chat interface
- `src/app/signin/page.tsx` - Authentication page
- `src/lib/prompt.ts` - AI system prompt and personality
- `src/lib/supabase.ts` - Supabase client and types
- `src/app/api/chat/route.ts` - Chat API endpoint
- `src/app/api/signin/route.ts` - Authentication API endpoint
- `src/app/api/history/route.ts` - Chat history API endpoint
- `src/app/globals.css` - Global styles and theming

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sender type enum
CREATE TYPE sender_type AS ENUM ('HUMAN', 'AI');

-- Messages table
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender sender_type,
  content TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `MISTRAL_API_KEY`
3. Deploy automatically on push to main branch

### Other Platforms

- **Netlify**: Build command: `npm run build`, Publish directory: `out`
- **Railway**: Connect repository and set environment variables
- **Render**: Build command: `npm run build`, Start command: `npm start`

## 📊 Performance

- **Bundle Size**: Optimized for fast loading in iframes
- **Responsiveness**: Smooth performance on all devices
- **Caching**: Efficient message history and session management
- **Streaming**: Real-time AI responses for better UX

## 🔒 Security

- **Authentication**: Simple email-based user session management
- **API Protection**: Rate limiting and validation
- **Data Privacy**: Secure message handling
- **CORS**: Proper iframe embedding permissions
- **Email Validation**: Server-side email format validation
- **Supabase Security**: Row Level Security (RLS) ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions or support:

- Email: connect.rahuldudi@gmail.com
- Portfolio: rahuldudi.vercel.app
- GitHub: github.com/rahuldudi

---

**Built with ❤️ by Rahul Dudi**
