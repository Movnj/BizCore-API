# 🚀 BizCore API v1.0

> **Powering businesses. Everywhere.** 🌍
> Built from Siak, Riau, Indonesia 🇮🇩

---

## 📁 Struktur Folder

```
bizcore-api/
├── src/
│   ├── config/
│   │   └── supabase.js         # Supabase client
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   ├── rateLimit.js        # Rate limiting
│   │   ├── validate.js         # Request validation (Joi)
│   │   └── errorHandler.js     # Global error handler
│   ├── routes/
│   │   └── v1/
│   │       ├── index.js        # Route aggregator
│   │       ├── auth.js         # Auth endpoints
│   │       ├── products.js     # Product endpoints
│   │       ├── transactions.js # Transaction endpoints
│   │       ├── reports.js      # Report endpoints
│   │       └── others.js       # Debts, branches, categories, team
│   ├── utils/
│   │   └── response.js         # Standardized responses
│   └── server.js               # Entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔑 Authentication

Semua endpoint (kecuali `/auth/register`, `/auth/login`) membutuhkan header:

```
Authorization: Bearer <access_token>
```

---

## 📡 Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | ❌ | Daftar akun baru |
| POST | `/api/v1/auth/login` | ❌ | Login |
| POST | `/api/v1/auth/refresh` | ❌ | Refresh token |
| GET  | `/api/v1/auth/me` | ✅ | Data user login |
| POST | `/api/v1/auth/logout` | ✅ | Logout |
| POST | `/api/v1/auth/forgot-password` | ❌ | Reset password |

### Products
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET    | `/api/v1/products` | All | Semua produk (+ filter, pagination) |
| GET    | `/api/v1/products/:id` | All | Detail produk |
| POST   | `/api/v1/products` | Admin+ | Tambah produk |
| PUT    | `/api/v1/products/:id` | Admin+ | Update produk |
| DELETE | `/api/v1/products/:id` | Admin+ | Hapus produk (soft) |
| PATCH  | `/api/v1/products/:id/stock` | Admin+ | Update stok |

### Transactions
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET  | `/api/v1/transactions` | All | Riwayat transaksi |
| GET  | `/api/v1/transactions/:id` | All | Detail transaksi |
| POST | `/api/v1/transactions` | All | Buat transaksi baru |

### Reports
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/reports/summary` | All | Ringkasan keuangan |
| GET | `/api/v1/reports/daily` | All | Laporan harian |
| GET | `/api/v1/reports/top-products` | All | Produk terlaris |

### Debts (Hutang/Piutang)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET   | `/api/v1/debts` | All | Semua hutang/piutang |
| POST  | `/api/v1/debts` | Admin+ | Tambah hutang/piutang |
| PATCH | `/api/v1/debts/:id/pay` | Admin+ | Bayar hutang/piutang |

### Others
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET  | `/api/v1/branches` | All | Semua cabang |
| POST | `/api/v1/branches` | Owner | Tambah cabang |
| GET  | `/api/v1/categories` | All | Semua kategori |
| POST | `/api/v1/categories` | Admin+ | Tambah kategori |
| GET  | `/api/v1/team` | Admin+ | Data tim |
| GET  | `/api/v1/team/invites` | Owner | Data invite |

---

## 📦 Response Format

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": { ... }
}
```

### Pagination
```json
{
  "success": true,
  "message": "Produk berhasil diambil",
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  },
  "data": [ ... ]
}
```

---

## 🚀 Setup & Deploy

### Local
```bash
# Install dependencies
npm install

# Copy env
cp .env.example .env
# Edit .env dengan nilai yang benar

# Run development
npm run dev
```

### Deploy ke Railway
1. Push ke GitHub
2. Buka [railway.app](https://railway.app)
3. New Project → Deploy from GitHub
4. Set environment variables dari `.env.example`
5. Deploy! 🚀

---

## 🔒 Security Features

- ✅ Helmet (security headers)
- ✅ CORS protection
- ✅ Rate limiting (anti brute force & DDoS)
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Input validation (Joi)
- ✅ Multi-tenant isolation
- ✅ Soft delete (data tidak hilang permanen)

---

*Built with ❤️ from Siak, Riau, Indonesia 🇮🇩*
*Started: A late night shift at Indah Kiat, 2025*
