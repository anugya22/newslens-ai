# NewsLens AI - Intelligent News Analysis Platform

A sophisticated AI-powered news analysis platform with market intelligence capabilities, built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **AI-Powered News Analysis**: Leverages OpenRouter's Stepfun model for intelligent news interpretation
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




*NewsLens AI - Transforming how you understand the news and markets*

---


**Intelligent Portfolio Tracking & Risk-Aware News Analysis**

NewsLens AI is a premium financial dashboard that solves the "noise" problem for investors. Unlike standard news apps, it doesn't just list headlines—it analyzes them against your actual portfolio to tell you exactly how global events affect your wealth.

---

## 🌎 How it Works: Real-Time News (No Public API)
Most financial apps rely on expensive, restrictive public APIs (like NewsAPI or Bloomberg) that often have delayed data. 

**NewsLens AI uses a custom-built Hybrid RSS Engine:**
-   **Direct Sourcing**: We pull data directly from top-tier financial RSS feeds (Economic Times, LiveMint, CNBC, Wall Street Journal, CoinDesk).
-   **CORS-Proxy Architecture**: A custom server-side proxy bypasses browser restrictions, allowing us to fetch news in real-time without being blocked.
-   **Zero Delay**: Because we source directly from publishers, you get news the moment it is published, without waiting for a third-party aggregator.

---

## 🤖 Specialized AI Modes
NewsLens AI features three distinct analysis modes to tailor the intelligence to your current focus:

1.  **Normal News Mode**: General news analysis. Focuses on clarity and readability, translating complex financial jargon into simple English. Translates upto 200 languages. Parses through links.
2.  **Market Mode**: Deep-dive analysis for stock investors. It identifies affected sectors, predicts bullish/bearish sentiment, and specifies which stocks in your portfolio are at risk.
3.  **Crypto Mode**: Optimized for the volatility of digital assets. It scans for regulatory changes, whale movements, and technological shifts that impact Bitcoin, Ethereum, and Altcoins.

---

## 🚀 Key Features

### 1. **Smart Portfolio Tracking**
-   **Live Data**: Real-time price updates for Stocks (via Finnhub) and Crypto (via CoinGecko).
-   **Auto-Calculations**: Instant visibility into Daily Change, Total Return, and Asset Distribution.
-   **Secure Storage**: Powered by Supabase with Row Level Security (RLS) to keep your financial data private.

### 2. **AI News Analyst (StepFun & Gemini)**
-   **Context-Aware**: The AI knows your holdings. It ignores irrelevant noise and focuses on news that actually impacts your money.
-   **Sentiment Scoring**: Automatically categorizes news as Positive, Negative, or Neutral.
-   **Deep Insight**: Identifies "Risks" and "Opportunities" with specific suggestions (Buy/Sell/Hold context).

### 3. **Smart Alerts System** 🚨
-   **High-Impact Scanning**: Continuous scanning for critical events (Market Crashes, Crypto Surges).
-   **Email Notifications**: Integrated with **Resend** to send instant alerts to your inbox when a High-Risk event is detected for one of your assets.
-   **Intelligent Caching**: Prevents duplicate alerts for the same news story.

---

## 🛠️ Tech Stack
-   **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion.
-   **Data Engine**: Hybrid RSS Parser (Economic Times, CNBC, WSJ, etc.).
-   **Backend/Auth**: Supabase (PostgreSQL).
-   **AI Intelligence**: OpenRouter (Llama 3, Gemini, StepFun).
-   **Communication**: Resend API.

---



## 🎯 Target Audience
-   **Retail Investors**: Professional-grade analysis without the Bloomberg price tag.
-   **Crypto Enthusiasts**: Real-time sentiment tracking for volatile markets.
-   **Busy Professionals**: Automated alerts so you only check the market when it actually matters.

---

