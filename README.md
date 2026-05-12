# BrutalBudget (Next.js + PostgreSQL)

Aplikasi web pencatat keuangan personal dengan desain **Brutalist**, responsif, siap deploy di VPS.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (Brutalist theme)
- Prisma ORM + PostgreSQL
- NextAuth (Credentials + optional Email Magic Link)
- AI Vision endpoint configurable (`AI_PROVIDER`, OpenAI-compatible)

## Fitur
- Register/Login user
- CRUD transaksi (income/expense)
- Ringkasan pemasukan, pengeluaran, saldo
- Dashboard protected session
- Endpoint AI Vision: `POST /api/ai/vision`

## Setup lokal
```bash
cp .env.example .env
# isi DATABASE_URL, NEXTAUTH_SECRET, AI_API_KEY
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Buka: http://localhost:3000

## Deploy VPS (PM2 + Nginx)

### 1) Build app
```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

### 2) Jalankan via PM2
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 3) Reverse proxy Nginx
Contoh site config:
```nginx
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Lalu:
```bash
sudo ln -s /etc/nginx/sites-available/brutalbudget /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## API AI Vision
`POST /api/ai/vision`
```json
{
  "imageUrl": "https://...",
  "prompt": "Extract transaction info"
}
```

Response memuat `text` hasil ekstraksi model.
