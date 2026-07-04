Smart Meal Planner
A dynamic web application designed to help users plan their meals efficiently, generate personalized recipes, and track nutritional goals. Originally built with React, the project was recently migrated to Next.js for better performance, server-side capabilities, and streamlined routing.

🚀 Key Features & Updates
Next.js Migration: Converted from standard React to Next.js to leverage App Router capabilities, optimizing performance and SEO.

Database Integration: Powered by MongoDB Atlas for robust, cloud-hosted data storage.

Iconography: Shifted to lucide-react for a clean, consistent, and lightweight UI icon library.

User Notifications: Integrated react-hot-toast (or your preferred toast library) for instant, accessible user feedback on actions.

🛠️ Getting Started
First, ensure you have your MongoDB Atlas connection string configured in a .env.local file:

Code snippet
MONGODB_URI=your_mongodb_atlas_connection_string
Next, run the development server:

Bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
Open http://localhost:3000 with your browser to see the result. You can start editing the page by modifying app/page.js.

🌐 Deployment
The application is fully deployed and hosted on the Vercel Platform. Any updates pushed to the main branch automatically trigger continuous deployment pipelines.

👥 The Team
This project was built and shipped thanks to the collaboration of:

Frontend Team: Kirti & Khushi

Backend Team: Paras & Pragati
