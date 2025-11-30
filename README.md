# 🌬️ AIRLUME - AI Air Quality Monitor

A modern, decentralized air quality monitoring dashboard built with React and powered by blockchain technology.

## ✨ Features

- **Real-time Air Quality Monitoring** - Live AQI tracking with beautiful visualizations
- **AI-Powered Predictions** - Masumi AI assistant for environmental analysis
- **Blockchain Verification** - Data integrity secured via Cardano blockchain
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Interactive Dashboard** - Multiple views including live data, network map, nodes, and more
- **Animated Background** - Stunning 3D perspective grid with particle effects
- **Glass Morphism UI** - Modern, sleek interface with backdrop blur effects

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd airlume
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## 🎨 UI/UX Enhancements

This project features several modern UI/UX improvements:

- **Smooth Animations** - Fade-in effects, hover transitions, and micro-interactions
- **Custom Scrollbars** - Styled scrollbars that match the theme
- **Glass Morphism** - Frosted glass effect on cards and panels
- **Gradient Effects** - Animated gradients and shimmer effects
- **Responsive Typography** - Optimized text sizing for all screen sizes
- **Accessibility** - Reduced motion support and proper focus states
- **Loading States** - Skeleton loaders and smooth transitions
- **Neon Glow Effects** - Cyberpunk-inspired text and border effects

## 📱 Views

- **Live Data** - Real-time sensor readings and AQI gauge
- **Network Map** - Global visualization of oracle nodes
- **Whitepaper** - Technical documentation
- **Nodes** - Active validator list with status
- **FAQ** - Frequently asked questions

## 🤖 Masumi AI

Click the floating AI button to interact with Masumi, your environmental analysis assistant. Features include:

- Detailed air quality analysis
- Predictive forecasting
- Blockchain data verification
- Morale booster with contextual humor

## 🛠️ Tech Stack

- **React 19** - Modern React with hooks
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Beautiful chart library
- **Lucide React** - Icon library
- **Canvas API** - Animated background effects

## 📦 Build

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## 🌐 API Integration

The app supports both live API data and local simulation:

- **Live Mode** - Connects to backend API at `http://localhost:3001/api/live`
- **Simulation Mode** - Falls back to client-side physics simulation if API is unavailable

## 🎯 Project Structure

```
airlume/
├── components/          # React components
│   ├── Header.jsx
│   ├── AQIGauge.jsx
│   ├── SensorGrid.jsx
│   ├── PredictionChart.jsx
│   ├── BlockchainStatus.jsx
│   ├── AlertsPanel.jsx
│   ├── MasumiAI.jsx
│   ├── AmbientBackground.jsx
│   └── Views.jsx
├── utils/              # Utility functions
│   ├── mockData.js
│   └── simulation.js
├── App.jsx             # Main app component
├── index.jsx           # Entry point
├── index.css           # Enhanced styles
└── index.html          # HTML template
```

## 🎨 Customization

You can customize the theme colors in `index.css` and Tailwind configuration. The main color palette uses:

- **Primary**: Emerald (#10b981)
- **Background**: Slate (#020617, #0f172a)
- **Accent**: Teal, Sky Blue

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- Cardano blockchain for data integrity
- Unsplash for placeholder images
- The React community for amazing tools and libraries

---

Built with ❤️ for a cleaner, more transparent future.
