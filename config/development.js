module.exports = {
  // API Configuration
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  apiVersion: process.env.REACT_APP_API_VERSION || 'v1',
  
  // Feature Flags
  enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  enableDebugMode: process.env.REACT_APP_ENABLE_DEBUG_MODE === 'true',
  
  // External Services
  sentryDsn: process.env.REACT_APP_SENTRY_DSN || '',
  googleAnalyticsId: process.env.REACT_APP_GOOGLE_ANALYTICS_ID || '',
  
  // Development
  environment: process.env.REACT_APP_ENVIRONMENT || 'development',
  
  // Storybook
  storybookPort: 6006,
  
  // Development Server
  devServerPort: 3000,
}; 