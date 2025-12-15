# FITSO.ME

> **Your Stuff. Your Style. Your Way.**
> 
> A modern, feature-rich personal wardrobe and belongings manager. Track clothing, accessories, gadgets & more. Create outfits, pack for trips, and showcase your style.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)

**FITSO.ME** (FIT·SO·ME) is a free, open-source web application that helps you manage everything you own without the overwhelm. Perfect for minimalists, fashion enthusiasts, travelers, and anyone who wants a clear view of their belongings.

All your data stays private and secure in your browser — no servers, no cloud, no sign-ups required.

## ✨ Features

### 🔄 Smart Import (NEW!)
- **One-click import from Myntra & Ajio** — Import dozens of items from your order history in minutes
- **Automatic data extraction** — Product images, names, brands, sizes, and prices pulled automatically
- **Smart category detection** — AI-powered categorization of imported items
- **Duplicate detection** — Identifies items you already have in your inventory
- **Retry logic** — Handles network errors gracefully with automatic retries
- **Privacy-focused** — Images are proxied through a secure server, no data stored

### 📦 Inventory Management
- Add unlimited items with photos, sizes, brands, colors, and notes
- Smart size system that adapts to item type (clothing, shoes, bags, watches)
- Track item condition, location, and purchase cost
- Grid and list views with search and filtering
- Duplicate items quickly for similar pieces
- Mark items as featured for your showcase

### 📊 Smart Dashboard
- Visual statistics and category breakdown
- Recently added items gallery
- Item condition overview
- "Consider Replacing" section for aging items
- Personalized greeting

### 👔 Outfit Combinations
- Create and save outfit combinations
- Organize by occasion and season
- Auto-suggest feature for outfit inspiration
- Visual outfit cards

### ✈️ Trip Packing Planner
- Create trips with destinations and dates
- Smart packing lists from your wardrobe
- Real-time packing progress
- Check off items as you pack

### ⭐ Showcase & Sharing
- Feature your favorite items
- Export to standalone HTML page
- Generate shareable links
- Perfect for style inspiration

### 🛒 Wishlist
- Track items you want to buy
- Priority levels and estimated costs
- Product links for quick purchasing
- Mark items as purchased

### 🔧 Phase-Out Tracker
- Monitor items marked for replacement
- Track aging and old items
- Maintain a fresh, functional collection

### 💾 Data Management
- Export data with images to folder
- Import from backup
- Auto-export scheduling
- Storage statistics
- 100% local, private storage

## 🔒 Privacy First

- **Local-first architecture** — All your data stays in your browser (IndexedDB)
- **No analytics or tracking** — We don't collect any personal data
- **No accounts required** — Start using immediately (optional sign-up for sync)
- **Offline-capable** — Works without internet (except for imports)
- **You control your data** — Export anytime, delete anytime
- **Secure image proxy** — Import feature uses a privacy-respecting proxy (images not stored on server)

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript** — Modern, type-safe UI
- **Vite** — Lightning-fast development
- **Tailwind CSS** — Beautiful styling
- **Radix UI** — Accessible components
- **Dexie.js** — IndexedDB for local storage
- **Lucide** — Gorgeous icons

### Backend (Optional - for sync & import)
- **Cloudflare Workers** — Edge computing for image proxy
- **Supabase** — Authentication & cloud sync
- **Hono** — Lightweight web framework

## 🚀 Getting Started

### For Users

Just visit [fitso.me](https://fitso.me) and start using the app! No installation needed.

**Quick Start:**
1. Click "Import Items" to import from Myntra or Ajio (fastest way!)
2. Or click "Add Manually" to add items one by one
3. Start creating outfits, packing lists, and showcasing your style

### For Developers

#### Prerequisites

- Node.js v16 or higher
- npm or yarn

#### Installation

```bash
# Clone the repository
git clone https://github.com/theshajha/wardrobe.git
cd wardrobe

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

#### Setting Up Cloud Sync & Import (Optional)

The import feature requires a Cloudflare Worker for the image proxy:

```bash
cd workers

# Install dependencies
npm install

# Configure Supabase credentials
# Copy workers/.dev.vars.example to workers/.dev.vars and fill in your credentials

# Deploy worker
npm run deploy
```

### Build for Production

```bash
# Build frontend
npm run build

# Build and deploy worker (if using sync/import features)
cd workers
npm run deploy
```

## 🎯 How the Import Feature Works

The import feature uses a clever bookmarklet approach:

1. **User drags a bookmarklet** to their browser's bookmarks bar
2. **Opens Myntra/Ajio orders page** and scrolls to load items
3. **Clicks the bookmarklet** which runs JavaScript to extract order data from the DOM
4. **Data is copied to clipboard** in a structured JSON format
5. **User pastes into the app** which processes and displays items
6. **Images are downloaded** through a privacy-respecting proxy
7. **Items are saved locally** with smart size detection and duplicate checking

**Supported stores:** Myntra, Ajio (more coming soon!)

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Mobile browsers | ✅ Full |

## 📚 Documentation

Detailed technical documentation is available in the `/docs` directory:

- **[E-Commerce Integration](docs/ECOMMERCE_INTEGRATION.md)** - Complete guide to the import feature, technical architecture, and adding new store integrations
- **[PostHog Analytics](docs/POSTHOG_ANALYTICS.md)** - Analytics setup and event tracking
- **[Supabase Email Template](docs/SUPABASE_EMAIL_TEMPLATE.md)** - Email configuration for magic link authentication

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built with love for people who appreciate organization and style.

**Special Thanks:**
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Dexie.js](https://dexie.org/)
- [Lucide](https://lucide.dev/)

---

**FIT·SO·ME** — Because your stuff should fit you perfectly. 👔✨

[Website](https://fitso.me) • [Report Bug](https://github.com/theshajha/wardrobe/issues) • [Request Feature](https://github.com/theshajha/wardrobe/issues)
