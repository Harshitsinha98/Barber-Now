# ✂️ BarberNow — Skip the wait. Book your barber.

A premium, location-based **barbershop discovery & booking platform** built for India 🇮🇳.
Customers discover nearby partner shops, see **live queue status**, view ratings & photos,
and book a service/slot online — **no more waiting in line**.

> This is **Phase 1: the Customer Website**. See `PROJECT_PLAN.md` for the full
> multi-phase roadmap (Barber app, Flutter mobile app, smart features).

---

## ✨ Features (Phase 1)

- **Location-based discovery** — browse partner barbershops near you, with search, city filter, and sort by _nearest / top-rated / shortest wait_.
- **Live virtual queue** — real-time "people ahead" + estimated wait time on every shop, with a live-advancing queue tracker after you book.
- **Premium shop profiles** — photo gallery (lightbox), verified ratings & reviews, barber profiles, full services menu with prices & offers.
- **Booking flow** — pick services, choose a barber, then either **join the virtual queue** (walk-in) or **book a time slot**.
- **Booking confirmation** — booking summary + live queue position / slot details + "we'll notify you" nudges.
- **Phone + OTP login UI** — India-friendly auth screen.
- **My Bookings** — upcoming (with queue tracking) + past visits.
- **Barber CTA** — "List your shop" entry point (Phase 2).

## 🛠️ Tech Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS** — custom premium _ink / gold / cream_ design system
- **lucide-react** icons
- Google Fonts: **Inter** (body) + **Playfair Display** (display)

> Data is currently **mock data** in `src/lib/data.ts`. Phase 2+ wires this to a
> real backend (Node/NestJS + PostgreSQL + Redis for the live queue).

## 🚀 Getting Started

```bash
npm install
npm run dev
# open http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout (fonts, navbar, footer)
│   ├── page.tsx              # Home / discovery landing
│   ├── globals.css           # Tailwind + design-system classes
│   ├── not-found.tsx
│   ├── login/page.tsx        # Phone + OTP auth UI
│   ├── bookings/page.tsx     # My bookings
│   ├── shop/[slug]/page.tsx  # Shop detail + booking
│   └── booking/confirm/page.tsx  # Confirmation + live queue tracker
├── components/               # Navbar, Footer, ShopCard, BookingWidget, QueueTracker, Gallery, ...
└── lib/                      # types, mock data, utils
```

## 🗺️ Roadmap

See [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) for the full plan:

- **Phase 1** ✅ Customer website (this)
- **Phase 2** Barber app — onboarding + self-manage services, photos, prices, discounts, queue
- **Phase 3** Flutter mobile app (customer) with push notifications
- **Phase 4** AI wait-time prediction, load balancing, multi-language, loyalty, home service

---

Built with ✂️ for Indian barbers & customers.
