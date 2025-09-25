# NewsLens AI - Intelligent News Analysis Platform

A sophisticated AI-powered news analysis platform with market intelligence capabilities, built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **AI-Powered News Analysis**: Leverages OpenRouter's Grok-4 Fast model for intelligent news interpretation
- **Market Analysis Mode**: Professional market impact analysis with sector insights, risk assessment, and investment opportunities
- **Real-time News Feed**: Integration with Google News RSS and optional NewsAPI.org
- **Interactive Chat Interface**: Natural language interaction for news queries and analysis
- **Link Parsing**: Analyze news articles by simply pasting URLs

### Advanced Features
- **Glassmorphism UI**: Modern, professional interface with smooth animations
- **News Carousel**: Swiper.js-powered sliding news feed with relevant articles
- **Market Intelligence**: 
  - Sector impact analysis
  - Risk assessment with probability scoring
  - Stock prediction insights
  - Market trend visualization
- **Sentiment Analysis**: Real-time sentiment detection for news articles
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Business Intelligence
- **Market Impact Scoring**: Quantified impact assessment (1-10 scale)
- **Risk Management**: Categorized risk factors with severity levels
- **Investment Opportunities**: AI-generated actionable insights
- **Confidence Metrics**: Transparency in prediction reliability

## 🛠 Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom utility classes
- **UI Components**: Custom glassmorphism components
- **Animations**: Framer Motion
- **Charts**: Recharts for data visualization
- **News Carousel**: Swiper.js
- **State Management**: Zustand with persistence
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## 📁 Project Structure

```
newslens-ai/
├── app/
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── chat/               # Chat interface components
│   │   ├── news/               # News display components
│   │   ├── analysis/           # Market analysis components
│   │   ├── layout/             # Layout components
│   │   └── settings/           # Settings and configuration
│   ├── lib/
│   │   ├── apis.ts            # API service classes
│   │   ├── store.ts           # Zustand store configuration
│   │   └── utils.ts           # Utility functions
│   ├── hooks/
│   │   ├── useChat.ts         # Chat functionality hook
│   │   └── useNews.ts         # News management hook
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── globals.css            # Global styles and utilities
│   ├── layout.tsx             # Root layout component
│   └── page.tsx               # Main application page
├── public/                    # Static assets
├── package.json
├── tailwind.config.js         # Tailwind configuration
├── next.config.js             # Next.js configuration
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd newslens-ai
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
The application uses UI-based API key configuration. No environment files needed for basic setup.

### 4. Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 API Configuration

### Required APIs
1. **OpenRouter API** (Required)
   - Visit [openrouter.ai](https://openrouter.ai)
   - Create account and get API key
   - Uses Grok-4 Fast model (free tier available)

### Optional APIs
2. **NewsAPI.org** (Optional - enhances news coverage)
   - Get free key at [newsapi.org](https://newsapi.org)
   - 1000 requests/day on free tier

3. **Alpha Vantage** (Optional - for stock market data)
   - Get free key at [alphavantage.co](https://alphavantage.co)
   - Real-time market data for analysis

### Configuration Steps
1. Click Settings icon in the header
2. Navigate to "API Configuration" tab
3. Enter your API keys
4. Test connections using the "Test" buttons
5. Save settings

Keys are stored securely in your browser's local storage.

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Deploy with default settings
4. Configure API keys in the deployed app


## 💡 Usage Guide

### Basic News Analysis
1. Type news-related questions in the chat
2. Paste article URLs for analysis
3. Use suggested prompts for quick queries

### Market Analysis Mode
1. Toggle "Market Mode" in the header
2. Ask about news for market impact analysis
3. View detailed market intelligence reports
4. Analyze sector impacts and risks

### News Navigation
- Browse trending topics in the sidebar
- Use the news carousel for recent articles
- Click articles for detailed views
- Bookmark important articles

## 🎨 Customization

### Theme Configuration
- Supports light/dark mode toggle
- Custom glassmorphism styling
- Responsive design patterns



### Adding Custom Components
1. Create component in appropriate folder
2. Follow glassmorphism design patterns
3. Use TypeScript interfaces
4. Include responsive design

## 📊 Performance Optimizations

- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Webpack bundle optimization
- **Lazy Loading**: Components loaded on demand
- **Caching**: API responses cached appropriately

## 🔒 Security Features

- **Client-side API Key Storage**: Keys stored in browser only
- **CORS Configuration**: Proper cross-origin handling
- **Input Validation**: All user inputs validated
- **XSS Protection**: React's built-in protection
- **Content Security Policy**: Implemented CSP headers
- **API Rate Limiting**: Built-in request throttling

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Type Checking
```bash
npm run type-check
```

## 🐛 Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify key format (OpenRouter keys start with "sk-or-")
   - Check API quotas and limits
   - Test connection using the built-in test feature

2. **News Not Loading**
   - Check browser console for CORS errors
   - Verify internet connection
   - Try refreshing the news feed

3. **Market Analysis Not Showing**
   - Ensure Market Mode is enabled
   - Verify OpenRouter API key is configured
   - Check recent messages for analysis data

4. **Performance Issues**
   - Clear browser cache and cookies
   - Check for console errors
   - Disable browser extensions temporarily

## 📈 Analytics & Monitoring

### Performance Metrics
- Page load times
- API response times
- User interaction tracking
- Error rate monitoring

### Usage Analytics
- Feature adoption rates
- Popular news categories
- Market mode usage patterns
- User engagement metrics

## 🔄 Updates & Maintenance

### Regular Maintenance
- Keep dependencies updated
- Monitor API rate limits
- Update news sources as needed
- Review and improve AI prompts

### Feature Roadmap
- [ ] Mobile app version
- [ ] Advanced chart types
- [ ] Custom news sources
- [ ] Team collaboration features
- [ ] Export functionality
- [ ] Advanced filtering options

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Maintain responsive design principles
3. Write comprehensive comments
4. Test on multiple browsers
5. Ensure accessibility standards

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Implement proper error handling
- Maintain consistent naming conventions



## 🙏 Acknowledgments

- OpenRouter for AI model access
- Google News for RSS feeds
- Alpha Vantage for market data
- NewsAPI.org for comprehensive news coverage
- Vercel for hosting platform

## 📞 Support

For technical issues or feature requests:
1. Check existing documentation
2. Review troubleshooting guide
3. Submit issues via GitHub

## 🔗 Links

- [Live Demo](https://newslens-ai.vercel.app/)
- [GitHub Repository](https://github.com/anugya22/newslens-ai.git)

<img width="956" height="476" alt="image" src="https://github.com/user-attachments/assets/50a6e422-3093-4b99-9bc0-10c04cc66597" />
<img width="502" height="422" alt="image" src="https://github.com/user-attachments/assets/f6ab6c7c-bd89-4408-b7a2-039c581a5898" />
<img width="959" height="413" alt="image" src="https://github.com/user-attachments/assets/c9125fda-54c6-47b1-ac7b-86c985ccde58" />



*NewsLens AI - Transforming how you understand the news and markets*
