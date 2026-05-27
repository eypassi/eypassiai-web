# Eypassiai Browser App Design

## Ziel

Die Browser-Version soll auf derselben Supabase-Datenbasis wie die iOS-App laufen. Nutzer melden sich mit demselben Konto an und sehen dieselben Objekte, Einheiten, Mieter, Verträge, Buchungen, Belege, Dokumente und KI-Funktionen.

## Architektur

Die erste Web-Version wird als React/Vite Single Page App gebaut. Sie nutzt den öffentlichen Supabase anon key im Browser, verlässt sich für Datenschutz auf Row Level Security und ruft bestehende Supabase Edge Functions für KI-Scan, Dokumenten-Chat und Agentenfunktionen auf.

## Deployment-Ziel

Lokal läuft die App über Vite. Produktion soll später auf `app.eypassiai.com` oder `eypassiai.com/app` liegen. Die vorhandenen statischen Seiten `privacy.html` und `terms.html` bleiben erreichbar.

## V1-Funktionsumfang

- Supabase Login, Registrierung und Passwort-Reset
- Dashboard mit Kennzahlen
- CRUD für Objekte, Einheiten, Mieter, Verträge, Buchungen
- Zusatzbereiche für Fahrtkosten, AfA, Portfolio und Nebenkosten
- Belegarchiv mit Suche, Upload, Download und KI-Scan
- Dokumente mit Upload, Download und Dokumenten-Chat
- KI-Datenfreigabe vor KI-Funktionen
- Profil mit E-Mail, Anzeigename und Logout

## Nicht in V1

- Web-Billing/Stripe/RevenueCat Web Checkout
- Pixelgenaue Parität mit der iOS-App
- Offline-Sync im Browser
- Vollständige deutsche/englische Lokalisierung
