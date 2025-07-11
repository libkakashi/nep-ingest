# NEP - AI-Powered Fashion Product Management System

NEP is a modern web application that streamlines the process of creating and managing fashion products in Shopify. Using AI image processing, it automatically generates product listings from uploaded images and seamlessly integrates with Shopify's Admin API.

## Features

- 🤖 **AI-Powered Image Processing**: Automatically analyzes clothing images to generate product details
- 🛍️ **Shopify Integration**: Direct product creation in your Shopify store
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🏷️ **Smart Categorization**: Automatically categorizes products based on image analysis
- 📊 **Inventory Management**: Sets up inventory tracking and stock levels
- 🎨 **Image Optimization**: Compresses and optimizes images for web use
- 📝 **Product Customization**: Edit product details before publishing

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: tRPC, Zod validation
- **AI Integration**: Multiple AI providers (OpenAI, Anthropic, Google, Groq)
- **E-commerce**: Shopify Admin API
- **Image Processing**: Custom compression and optimization
- **UI Components**: Radix UI, Lucide React

## Prerequisites

- Node.js 20+ or Bun 1+
- Shopify store with Admin API access
- API keys for AI services

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nep
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables (see [Environment Variables](#environment-variables))

4. Start the development server:
```bash
npm run dev
# or
bun dev
```

The application will be available at `http://localhost:3000`.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Shopify Configuration
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-admin-api-token

# AI Service API Keys (configure at least one)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key
GROQ_API_KEY=your-groq-key
```

### Shopify Setup

1. Go to your Shopify admin panel
2. Navigate to Apps > Develop apps
3. Create a new app and configure the Admin API permissions:
   - Products: Read and write
   - Inventory: Read and write
   - Files: Read and write
   - Online Store: Read and write
4. Install the app and copy the access token

## Usage

### 1. Upload Images
- Navigate to the home page
- Upload one or more clothing/fashion images
- The AI will automatically process and analyze the images

### 2. Review Generated Products
- Review the automatically generated product details
- Edit titles, descriptions, categories, and pricing as needed
- Adjust size information and other product specifications

### 3. Create Products in Shopify
- Click "Create Products in Shopify" to publish all products
- Products will be created with optimized images and proper categorization
- Inventory tracking will be automatically set up

## API Endpoints

The application provides the following tRPC endpoints:

- `products.processImages` - Process uploaded images and generate product data
- `products.createShopifyProduct` - Create a single product in Shopify

## Project Structure

```
nep/
├── src/
│   ├── app/
│   │   └── page.tsx              # Main application page
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   ├── product-card.tsx      # Product display component
│   │   └── image-upload-section.tsx # Image upload interface
│   ├── lib/
│   │   ├── shopify.ts           # Shopify Admin API integration
│   │   ├── products.ts          # Product processing logic
│   │   └── image-compression.ts # Image optimization utilities
│   └── server/
│       └── api/
│           └── routers/
│               └── products.ts   # tRPC API routes
├── package.json
└── README.md
```

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run fix` - Auto-fix linting issues

### Code Quality

This project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Google TypeScript Style (GTS)** for consistent code style

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically with each push

### Docker

Build and run with Docker:

```bash
docker build -t nep .
docker run -p 3000:3000 nep
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For support and questions, please create an issue in the repository.
