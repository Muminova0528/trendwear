# TrendWear Distribution — Bulutli Boshqaruv Platformasi

BTEC HND Digital Technologies · **Unit 6: Networking in the Cloud** topshirig'i uchun amaliy loyiha.

Tayyor kiyim-kechak ulgurji kompaniyasi (TrendWear Distribution Ltd) uchun **ERP + CRM + WMS** tizimlarini yagona xavfsiz bulutli tarmoq ichida birlashtiruvchi to'liq ishlaydigan platforma.

---

## Texnologiyalar

| Qatlam | Texnologiya |
|--------|-------------|
| Frontend | HTML / CSS / Vanilla JS (chiroyli SPA), Nginx orqali serve qilinadi |
| Load Balancer | Nginx (round-robin / least_conn) |
| Backend | FastAPI (Python 3.12), JWT autentifikatsiya |
| Ma'lumotlar bazasi | PostgreSQL 16 |
| Konteynerizatsiya | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## Arxitektura — uch qatlamli (3-tier) VPC

Docker Compose tarmoqlari yordamida bulutdagi VPC arxitekturasi taqlid qilinadi:

```
                      Internet
                         │
                  ┌──────▼──────┐
   PUBLIC SUBNET  │  frontend   │  ← Nginx: statik UI + Load Balancer (80-port)
                  │   (nginx)   │     Yagona tashqi kirish nuqtasi
                  └──────┬──────┘
                         │  app_subnet
              ┌──────────┴──────────┐
   APP SUBNET │ backend × 2 replica │  ← FastAPI (auto-scaling taqlidi)
              │   (FastAPI)         │     Tashqi portsiz — faqat nginx orqali
              └──────────┬──────────┘
                         │  private_subnet (internal: true)
                  ┌──────▼──────┐
  PRIVATE SUBNET  │     db      │  ← PostgreSQL. Internetga UMUMAN chiqmaydi.
                  │ (PostgreSQL)│
                  └─────────────┘
```

Bu brif talablarini qondiradi: **VPC** (izolyatsiyalangan tarmoq), **Public/Private subnet**, **Internet Gateway** (frontend 80-port), **Load Balancing** (nginx upstream), **NAT/izolyatsiya** (`internal: true` private subnet), **auto-scaling** (replicas).

---

## Loyiha tuzilmasi

```
trendwear/
├── backend/                 # FastAPI ilovasi
│   ├── app/
│   │   ├── main.py          # API endpointlar (auth, products, customers, orders, load-test)
│   │   ├── models.py        # SQLAlchemy modellari (ERP/CRM/WMS)
│   │   ├── schemas.py       # Pydantic sxemalari
│   │   ├── auth.py          # JWT + parol hashlash
│   │   ├── database.py      # PostgreSQL ulanishi
│   │   ├── seed.py          # Demo ma'lumotlar
│   │   └── config.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # Nginx + SPA
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── nginx.conf           # Load balancer + reverse proxy
│   └── Dockerfile
├── .github/workflows/
│   └── ci-cd.yml            # CI/CD pipeline
└── docker-compose.yml
```

---

## Ishga tushirish (lokal)

Faqat **Docker** va **Docker Compose** kerak.

```bash
cd trendwear
docker compose up -d --build
```

Tayyor bo'lgach brauzerda oching: **http://localhost**

### Demo hisoblar

| Email | Parol | Rol |
|-------|-------|-----|
| `admin@trendwear.uz` | `admin123` | admin |
| `manager@trendwear.uz` | `manager123` | manager |

---

## Bitta serverga (VPS) deploy qilish

Brif talabi — barchasi bitta serverda ishga tushirilishi kerak. Quyidagi qadamlar Ubuntu serverga mos:

```bash
# 1. Serverda Docker o'rnatish (agar yo'q bo'lsa)
curl -fsSL https://get.docker.com | sh

# 2. Loyihani serverga ko'chirish
git clone <repo-url> /opt/trendwear
cd /opt/trendwear

# 3. Ishga tushirish
docker compose up -d --build

# 4. Holatni tekshirish
docker compose ps
```

Sayt server IP manzilining **80-portida** ochiladi (`http://<server-ip>`).
Domen ulash uchun DNS A-yozuvini server IP'ga yo'naltiring.

> **Maslahat:** Production'da `backend/config.py` dagi `SECRET_KEY` va `docker-compose.yml` dagi DB parolni o'zgartiring. HTTPS uchun nginx oldiga Caddy yoki Certbot qo'shing.

---

## Render.com'ga deploy qilish (eng oson yo'l)

> **Muhim:** Render `docker-compose`ni ishlatmaydi. Shuning uchun bu loyiha
> Render uchun moslashtirildi — frontend UI va backend API **bitta web-service**
> ichida birlashtirildi, PostgreSQL esa Render'ning boshqariladigan bazasi
> sifatida alohida ishlaydi. Buni `render.yaml` (Blueprint) avtomatik bajaradi.

### Qadamlar

1. Loyihani GitHub'ga yuklang (push qiling).
2. [render.com](https://render.com) → **New** → **Blueprint**.
3. GitHub repozitoriyangizni ulang. Render `render.yaml` faylini avtomatik topadi.
4. **Apply** bosing. Render quyidagilarni yaratadi:
   - `trendwear-db` — PostgreSQL bazasi (bepul reja),
   - `trendwear` — Docker web-service (FastAPI + SPA).
5. `DATABASE_URL` va `SECRET_KEY` avtomatik ulanadi — qo'lda hech narsa kiritish shart emas.
6. Deploy tugagach, Render bergan manzilni oching (masalan `https://trendwear.onrender.com`).

### Demo hisoblar (Render'da ham ishlaydi)

| Email | Parol |
|-------|-------|
| `admin@trendwear.uz` | `admin123` |
| `manager@trendwear.uz` | `manager123` |

> **Eslatma — load balancing:** Compose versiyasidagi 2 replica + nginx LB
> namoyishi mahalliy/VPS uchun saqlanib qoldi (pastdagi bo'lim). Render'ning
> bepul rejasi bitta instansiya beradi; ko'p instansiya uchun Render'da
> servis sozlamalaridan **Scaling** ni oshiring (pullik reja). `/api/load-test`
> va `/api/health` endpointlari Render'da ham ishlaydi.

### Lokal vs Render — qaysi fayl nima uchun

| Fayl | Maqsad |
|------|--------|
| `docker-compose.yml` | Lokal / VPS — to'liq 3-tier arxitektura, nginx LB, 2 replica |
| `render.yaml` | Render — bitta web-service + boshqariladigan Postgres |
| `backend/static/` | Frontend fayllari (Render'da FastAPI tomonidan xizmat qilinadi) |

---

## Auto-scaling / Load Balancing namoyishi

1. Saytga kiring → chap menyudan **"Yuklama testi"** ni tanlang.
2. So'rovlar sonini kiriting va **"Testni boshlash"** bosing.
3. Har bir so'rovga qaysi backend **node** (konteyner) javob berayotganini real vaqtda kuzating — Nginx load balancer so'rovlarni 2 ta replica orasida taqsimlaydi.

Backend nodelar sonini ko'paytirish (qo'lda scaling):

```bash
docker compose up -d --scale backend=4
```

Endi yuklama testida 4 ta node orasida taqsimlanishni ko'rasiz.

---

## API hujjatlari

FastAPI avtomatik Swagger UI generatsiya qiladi:
**http://localhost/api/docs** (yoki backend to'g'ridan-to'g'ri: konteyner ichida `:8000/docs`)

Asosiy endpointlar:

- `POST /api/auth/login` — tizimga kirish
- `GET  /api/dashboard` — umumiy statistika
- `GET/POST/PUT/DELETE /api/products` — ombor (WMS)
- `GET/POST/DELETE /api/customers` — mijozlar (CRM)
- `GET/POST/PATCH /api/orders` — buyurtmalar (ERP)
- `GET  /api/health` — salomatlik (load balancer uchun)
- `GET  /api/load-test/{n}` — yuklama testi (auto-scaling namoyishi)

---

## Brif mezonlariga moslik

| Mezon | Qanday qoplanadi |
|-------|------------------|
| C.P5 — tarmoq yechimi dizayni | 3-tier VPC arxitekturasi (compose tarmoqlari) |
| C.P6 — amalga oshirish | To'liq ishlaydigan FastAPI + PostgreSQL + Nginx tizimi |
| C.M3 — unumdorlik/kengayish testi | Yuklama testi sahifasi + `--scale` |
| D.P7/P8 — yaxshilashlar | Load balancer (least_conn), replica scaling, salomatlik tekshiruvi |
| Task 1 — CI/CD, auto-scaling, load balancing | GitHub Actions pipeline + Nginx LB + replicas |
| Dinamik veb-sayt joylashtirish | Konteynerlangan SPA + API, bitta serverda deploy |
