# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment on Render

This project is set up to be deployed as a monolithic application on Render using Docker.

### Steps to Deploy:

1. **Create a new Web Service** on Render and connect your repository.
2. **Environment**: Select **Docker**.
3. **Region**: Choose the region closest to your database (Supabase).
4. **Environment Variables**:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string (e.g., `postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres`).
   - `SECRET_KEY`: A random string for Flask security.
5. **Render will automatically build** the React frontend and the Python backend using the provided `Dockerfile`.

### Database Troubleshooting:

If you encounter connection timeouts:
- Ensure your Supabase database is not paused.
- Check that `sslmode=require` is included in your connection string if not handled automatically.
- The app now uses `psycopg2` which is more robust for Render-to-Supabase connections.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
