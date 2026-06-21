# 🍼 Babysitter – Server

Node.js + Express server for the Babysitter platform (Shenkar College, 2026).

## Setup

```bash
npm install
cp .env.example .env   # fill in JWT_SECRET
npm run dev            # development (nodemon)
npm start              # production
```

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | – | הרשמת משתמש חדש (family/sitter) |
| POST | `/api/auth/login` | – | התחברות + JWT |
| GET | `/api/auth/me` | ✅ | פרטי המשתמש המחובר |
| GET | `/api/sitters` | – | כל הבייביסיטרים (עם חיפוש/סינון) |
| GET | `/api/sitters/:id` | – | בייביסיטר לפי ID |
| POST | `/api/sitters` | ✅ | הוספת בייביסיטר |
| PUT | `/api/sitters/:id` | ✅ | עדכון פרופיל |
| DELETE | `/api/sitters/:id` | ✅ | מחיקת בייביסיטר |
| GET | `/api/sitters/:id/stats` | – | סטטיסטיקות (ממוצע, הכנסות) |
| GET | `/api/families` | ✅ | כל המשפחות |
| GET | `/api/families/:id` | ✅ | משפחה לפי ID |
| POST | `/api/families` | ✅ | הוספת משפחה |
| PUT | `/api/families/:id` | ✅ | עדכון משפחה |
| DELETE | `/api/families/:id` | ✅ | מחיקת משפחה |
| GET | `/api/bookings` | ✅ | הזמנות (עם פילטרים) |
| GET | `/api/bookings/:id` | ✅ | הזמנה לפי ID |
| POST | `/api/bookings` | ✅ | יצירת הזמנה |
| PUT | `/api/bookings/:id` | ✅ | עדכון סטטוס |
| DELETE | `/api/bookings/:id` | ✅ | מחיקת הזמנה |
| GET | `/api/bookings/family/:familyId` | ✅ | הזמנות משפחה (עם נתוני בייביסיטר) |
| GET | `/api/reviews/sitter/:sitterId` | – | ביקורות על בייביסיטר |
| POST | `/api/reviews` | ✅ | הוספת ביקורת |
| GET | `/api/geo/geocode?address=` | – | המרת כתובת ל-lat/lng (Nominatim API) |

## Search & Filter Examples

```
GET /api/sitters?name=דנה
GET /api/sitters?maxPrice=60&minRating=4
GET /api/sitters?hood=תל+אביב
GET /api/bookings?status=confirmed&date=2026-06-01
```

## External API

Uses [Nominatim (OpenStreetMap)](https://nominatim.openstreetmap.org/) for geocoding — converts a sitter's address to lat/lng coordinates on registration.

## JS Library

Client uses [Leaflet.js](https://leafletjs.com/) for interactive map display.
