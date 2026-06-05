# 🔗 LinkVibe: High-Speed URL Shortener & Analytics

LinkVibe is an open-source, full-stack URL management tool designed for modern creators. It allows users to generate elegant, high-speed URL aliases and track real-time traffic statistics through a beautiful dark-mode interface.

![LinkVibe Dashboard Preview](https://via.placeholder.com/1000x500.png?text=LinkVibe+Dashboard+Screenshot) *(Note: Replace this link with an actual screenshot of your app once deployed)*

## ✨ Key Features

* **Instant Shortening:** Convert long, unwieldy URLs into clean, manageable links.
* **Real-Time Analytics:** Track click rates and engagement directly on the dashboard.
* **Modern UI/UX:** Built with a premium dark theme, glassmorphism elements, and smooth framer-motion animations.
* **Serverless Backend:** High-performance API routes powered by Next.js and MongoDB.
* **Atomic Counters:** Uses MongoDB `$inc` operators to ensure highly accurate, concurrent click tracking.

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router)
* **Language:** JavaScript
* **Database:** MongoDB & Mongoose
* **Styling:** Tailwind CSS
* **Icons & UI:** Lucide React, Sonner (Toasts), Framer Motion

## 🚀 Getting Started Locally

Want to run LinkVibe on your own machine? Follow these steps:

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/url-shortener.git
cd url-shortener
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Set up Environment Variables
Create a `.env.local` file in the root of the project and add your MongoDB connection string and base URL:
\`\`\`text
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.../url_shortener?retryWrites=true&w=majority
NEXT_PUBLIC_BASE_URL=http://localhost:3000
\`\`\`

### 4. Run the Development Server
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 💡 How the Redirect Logic Works

When a user visits a shortened URL (e.g., `linkvibe.com/fJkVlG`), the Next.js dynamic API route (`app/[shortCode]/route.js`) intercepts the request:
1. It queries MongoDB for the matching `shortCode`.
2. It atomically increments the `clicks` counter in the database.
3. It uses `NextResponse.redirect()` to instantly forward the user to the `originalUrl`.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](#) if you want to contribute.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).