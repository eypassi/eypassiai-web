import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { publicObjectUrl, supabase } from "./supabase";

type ViewKey =
  | "dashboard"
  | "properties"
  | "units"
  | "tenants"
  | "contracts"
  | "transactions"
  | "receipts"
  | "documents"
  | "travel"
  | "afa"
  | "utility"
  | "portfolio"
  | "ai"
  | "profile";

type PropertyRow = {
  id: string;
  user_id: string;
  address: string;
  type: string;
  purchase_price: number | null;
  purchase_date: string | null;
  image_url?: string | null;
};

type UnitRow = {
  id: string;
  user_id: string;
  property_id: string;
  name: string;
  sqm: number | null;
  usage_type?: string | null;
};

type PropertyImageRow = {
  id: string;
  user_id: string;
  property_id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number;
  created_at: string | null;
};

type UnitImageRow = {
  id: string;
  user_id: string;
  unit_id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number;
  created_at: string | null;
};

type TenantRow = {
  id: string;
  user_id: string;
  property_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  sqm?: number | null;
  profile_image_url?: string | null;
};

type ContractRow = {
  id: string;
  user_id: string;
  tenant_id: string;
  unit_id?: string | null;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  deposit: number | null;
  notes: string | null;
  lease_purpose?: string | null;
  vat_option?: string | null;
  vat_rate?: number | null;
};

type TransactionRow = {
  id: string;
  user_id: string;
  property_id: string | null;
  tenant_id?: string | null;
  contract_id?: string | null;
  amount: number;
  category: string;
  date: string;
  receipt_url: string | null;
  notes: string | null;
  vendor?: string | null;
  tax_net_amount?: number | null;
  vat_rate?: number | null;
  vat_amount?: number | null;
  gross_amount?: number | null;
  iban?: string | null;
  bic?: string | null;
  recipient?: string | null;
  reference?: string | null;
  property_address?: string | null;
  is_verified?: boolean | null;
  import_source?: string | null;
};

type DocumentRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  property_id: string | null;
  tenant_id?: string | null;
  created_at: string;
};

type TravelRow = {
  id: string;
  user_id: string;
  property_id: string | null;
  date: string;
  km: number;
  purpose: string;
};

type AfaRow = {
  id: string;
  user_id: string;
  property_id: string | null;
  object_name: string;
  acquisition_cost: number;
  useful_life_years: number;
  start_date: string;
};

type UtilityRow = {
  id: string;
  user_id: string;
  property_id: string;
  year: number;
  line_items: unknown[];
};

type PortfolioRow = {
  id: string;
  user_id: string;
  property_id: string;
  snapshot_date: string;
  current_value: number;
  annual_income: number | null;
  annual_expenses: number | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type ScanResult = {
  amount?: number | null;
  date?: string | null;
  vendor?: string | null;
  category?: string | null;
  notes?: string | null;
  confidence?: number | null;
  taxNetAmount?: number | null;
  vatRate?: number | null;
  vatAmount?: number | null;
  grossAmount?: number | null;
  iban?: string | null;
  bic?: string | null;
  recipient?: string | null;
  reference?: string | null;
  propertyAddress?: string | null;
};

type DataState = {
  properties: PropertyRow[];
  units: UnitRow[];
  propertyImages: PropertyImageRow[];
  unitImages: UnitImageRow[];
  tenants: TenantRow[];
  contracts: ContractRow[];
  transactions: TransactionRow[];
  documents: DocumentRow[];
  travel: TravelRow[];
  afa: AfaRow[];
  utility: UtilityRow[];
  portfolio: PortfolioRow[];
  profile: ProfileRow | null;
};

const emptyData: DataState = {
  properties: [],
  units: [],
  propertyImages: [],
  unitImages: [],
  tenants: [],
  contracts: [],
  transactions: [],
  documents: [],
  travel: [],
  afa: [],
  utility: [],
  portfolio: [],
  profile: null,
};

const nav: Array<{ key: ViewKey; label: string; icon: string }> = [
  { key: "dashboard", label: "Heute", icon: "⌂" },
  { key: "properties", label: "Objekte", icon: "▦" },
  { key: "units", label: "Einheiten", icon: "□" },
  { key: "tenants", label: "Mieter", icon: "◉" },
  { key: "contracts", label: "Verträge", icon: "≡" },
  { key: "transactions", label: "Buchungen", icon: "€" },
  { key: "receipts", label: "Belege", icon: "⌁" },
  { key: "documents", label: "Dokumente", icon: "▣" },
  { key: "travel", label: "Fahrtkosten", icon: "↔" },
  { key: "afa", label: "AfA", icon: "%" },
  { key: "utility", label: "NK", icon: "↕" },
  { key: "portfolio", label: "Portfolio", icon: "▤" },
  { key: "ai", label: "KI-Assistent", icon: "✦" },
  { key: "profile", label: "Profil", icon: "◎" },
];

const propertyTypes = ["Wohnung", "Haus", "Gewerbe", "Garage", "Sonstiges"];
const categories = [
  "Mieteinnahmen",
  "Kaltmiete",
  "Nebenkostenvorauszahlung",
  "Reparaturen",
  "Wartung",
  "Grundsteuer",
  "Gebäudeversicherung",
  "Hausverwaltung",
  "Darlehenszinsen",
  "Steuerberaterkosten",
  "Fahrtkosten",
  "Sonstiges",
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function eur(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "–";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

function numberValue(value: FormDataEntryValue | null) {
  if (!value) return null;
  const normalized = String(value).replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function textValue(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

function bytesToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function userFolder(userId: string) {
  return userId.toLowerCase();
}

function fileExtension(file: File) {
  if (file.type.includes("png")) return "png";
  if (file.type.includes("webp")) return "webp";
  return "jpg";
}

async function uploadPublicImage(bucket: string, path: string, file: File) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return publicObjectUrl(bucket, path);
}

function storagePathFromUrl(bucket: string, url: string | null | undefined) {
  if (!url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return url;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index >= 0) return decodeURIComponent(url.slice(index + marker.length));
  const privateMarker = `/storage/v1/object/${bucket}/`;
  const privateIndex = url.indexOf(privateMarker);
  if (privateIndex >= 0) return decodeURIComponent(url.slice(privateIndex + privateMarker.length));
  const bucketMarker = `/${bucket}/`;
  const bucketIndex = url.indexOf(bucketMarker);
  if (bucketIndex >= 0) {
    const extracted = url.slice(bucketIndex + bucketMarker.length).split("?")[0];
    return decodeURIComponent(extracted);
  }
  return null;
}

function isImageUrl(url: string | null | undefined) {
  if (!url) return false;
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);
}

function isPdfUrl(url: string | null | undefined) {
  if (!url) return false;
  return /\.pdf(\?|$)/i.test(url);
}

function isImageDocument(document: DocumentRow) {
  return Boolean(document.file_type?.startsWith("image/") || isImageUrl(document.file_url));
}

function useAiConsent() {
  const [consented, setConsented] = useState(() => localStorage.getItem("eypassiai.aiConsent") === "true");

  function grant() {
    localStorage.setItem("eypassiai.aiConsent", "true");
    setConsented(true);
  }

  return { consented, grant };
}

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/" || pathname === "/index.html") {
    return <LandingPage />;
  }

  return <AppRuntime />;
}

const LogoMark = ({ size = 28 }: { size?: number }) => (
  <img
    src="/app-icon.png"
    alt=""
    aria-hidden="true"
    width={size}
    height={size}
    style={{ borderRadius: "50%", display: "block", flexShrink: 0 }}
  />
);

const IconReceipt = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M7 2H15C16.1 2 17 2.9 17 4V20L14 18L11 20L8 18L5 20V4C5 2.9 5.9 2 7 2Z" stroke="#b6ff5b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 8H13M9 11H13M9 14H11" stroke="#b6ff5b" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 9.5L11 3L19 9.5V19C19 19.55 18.55 20 18 20H14V15H8V20H4C3.45 20 3 19.55 3 19V9.5Z" stroke="#b6ff5b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconTax = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="3" y="2" width="14" height="18" rx="2" stroke="#b6ff5b" strokeWidth="1.6" />
    <path d="M7 7H13M7 10.5H13M7 14H10" stroke="#b6ff5b" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M15 14L17 16L21 12" stroke="#b6ff5b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconAI = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="8" stroke="#071006" strokeWidth="1.6" />
    <path d="M8 11C8 9.34 9.34 8 11 8C12.66 8 14 9.34 14 11" stroke="#071006" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="11" cy="14" r="1" fill="#071006" />
  </svg>
);

const IconCheck = ({ dark = false }: { dark?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 7l3.5 3.5L12 3" stroke={dark ? "#71b060" : "#b6ff5b"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <path d="M7 1.5L2 3.5V7C2 10 7 12.5 7 12.5S12 10 12 7V3.5L7 1.5Z" stroke="#b6ff5b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 7l1.5 1.5L9 5" stroke="#b6ff5b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function AppMockup() {
  const previewNav = ["Heute", "Objekte", "Einheiten", "Mieter", "Verträge", "Buchungen", "Belege", "Dokumente", "AfA", "KI"];
  const previewTransactions = [
    ["12.03.2026", "Hausgeld", "Babenhäuser Str. 15", "-184,20 €", "neg"],
    ["01.03.2026", "Miete", "Wohnung EG", "+980,00 €", "pos"],
    ["27.02.2026", "Reparatur", "Mehrfamilienhaus", "-68,50 €", "neg"],
  ] as const;

  return (
    <div className="mockup-device" aria-label="App-Vorschau">
      <div className="mockup-chrome">
        <span className="mockup-dot" />
        <span className="mockup-dot" />
        <span className="mockup-dot" />
        <div className="mockup-urlbar">eypassiai.com/app</div>
      </div>
      <div className="mockup-layout">
        <aside className="mockup-sidebar">
          <div className="mockup-brand">
            <LogoMark size={16} />
            eypassiai
          </div>
          <nav className="mockup-nav">
            {previewNav.map((item) => (
              <div key={item} className={`mockup-nav-item${item === "Heute" ? " active" : ""}`}>
                <span className="mockup-nav-icon" aria-hidden="true">
                  {item === "Heute" ? "⌂" : item === "Belege" ? "▤" : item === "KI" ? "✦" : "□"}
                </span>
                {item}
              </div>
            ))}
          </nav>
        </aside>
        <main className="mockup-main">
          <div className="mockup-topbar">
            <div>
              <span className="mockup-kicker">Live verbunden</span>
              <span className="mockup-page-title">Heute</span>
            </div>
            <div className="mockup-actions">
              <span>Aktualisieren</span>
              <span>Abmelden</span>
            </div>
          </div>
          <div className="mockup-metrics-row">
            <div className="mockup-metric-card">
              <span className="mockup-metric-label">Objekte</span>
              <strong className="mockup-metric-value">3</strong>
            </div>
            <div className="mockup-metric-card">
              <span className="mockup-metric-label">Monatsmiete</span>
              <strong className="mockup-metric-value">2.840 €</strong>
            </div>
            <div className="mockup-metric-card">
              <span className="mockup-metric-label">Einnahmen 2026</span>
              <strong className="mockup-metric-value">8.520 €</strong>
            </div>
            <div className="mockup-metric-card">
              <span className="mockup-metric-label">Ausgaben 2026</span>
              <strong className="mockup-metric-value danger">-1.240 €</strong>
            </div>
          </div>
          <div className="mockup-work-panel">
            <div>
              <span className="mockup-kicker">Arbeitsstand</span>
              <strong>3 Belege prüfen</strong>
              <p>Die Web-App nutzt dieselben Supabase-Tabellen wie deine iOS-App.</p>
            </div>
            <div className="mockup-work-actions">
              <span className="primary">Beleg scannen</span>
              <span>Buchung erfassen</span>
            </div>
          </div>
          <div className="mockup-rows">
            <div className="mockup-table-head">
              <span>Datum</span>
              <span>Kategorie</span>
              <span>Objekt</span>
              <span>Betrag</span>
            </div>
            {previewTransactions.map(([date, category, object, amount, tone]) => (
              <div key={`${date}-${category}`} className="mockup-row">
                <span className="mockup-row-date">{date}</span>
                <span className="mockup-row-title">{category}</span>
                <span className="mockup-row-object">{object}</span>
                <span className={`mockup-row-amount ${tone}`}>{amount}</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function LandingPage() {
  const plans = [
    {
      name: "Kostenlos",
      tag: "Zum Start",
      desc: "Für den ersten Überblick und zum Testen.",
      items: ["Objekte ausprobieren", "Basis-Archiv", "Profil & Login"],
      featured: false,
    },
    {
      name: "Basis",
      tag: "Private Vermieter",
      desc: "Für laufende Verwaltung mit Buchungen und Belegen.",
      items: ["Buchungen verwalten", "Belege scannen", "Anlage-V-Vorbereitung", "Monats- oder Jahresabo"],
      featured: false,
    },
    {
      name: "Pro",
      tag: "Alle Features",
      desc: "Für größere Portfolios und volle KI-Nutzung.",
      items: ["Unbegrenzte Scans", "Mehr KI-Nachrichten", "AfA & Nebenkosten", "Dokumenten-Chat"],
      featured: true,
    },
  ];

  const faqs: [string, string][] = [
    ["Für wen ist eypassiai?", "Für private Vermieter in Deutschland mit ein bis zehn Immobilien — die Buchungen, Belege und die Steuervorbereitung ohne komplizierte Buchhaltungssoftware organisieren wollen."],
    ["Gibt es eine iPhone-App?", "Ja. Die native iOS-App steht im Apple App Store und synchronisiert sich über dasselbe Konto mit der Web-App."],
    ["Wie sicher sind meine Daten?", "Deine Daten liegen auf Servern in der EU und werden nicht für Werbung genutzt. KI-Funktionen senden nur Inhalte, die du ausdrücklich freigibst."],
    ["Was beinhaltet der kostenlose Plan?", "Du kannst Objekte anlegen, das Interface kennenlernen und dein Profil einrichten — ohne Abo und ohne Kreditkarte. Buchungen und Belege sind Teil der bezahlten Pläne."],
    ["Kann ich jederzeit kündigen?", "Ja. Abos laufen über den Apple App Store und können dort jederzeit gekündigt werden. Der kostenlose Plan bleibt dauerhaft verfügbar."],
    ["Brauche ich Buchhaltungskenntnisse?", "Nein. Die App führt dich Schritt für Schritt. Die Steuer-Hilfefunktionen strukturieren deine Daten — ersetzen aber keine Steuerberatung."],
  ];

  return (
    <main className="landing-page">
      <header className="landing-header">
        <nav className="landing-nav" aria-label="Hauptnavigation">
          <a className="landing-logo" href="/">
            <LogoMark size={26} />
            eypassiai
          </a>
          <div className="landing-nav-links">
            <a href="#funktionen">Funktionen</a>
            <a href="#ablauf">Ablauf</a>
            <a href="#abos">Abos</a>
            <a href="#faq">FAQ</a>
          </div>
          <a className="landing-nav-cta" href="/app/">
            App öffnen
            <IconArrow />
          </a>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Immobilienverwaltung · Private Vermieter · Deutschland
          </p>
          <h1>
            Vermieten ohne <em>Chaos.</em>
          </h1>
          <p>
            Objekte, Mieter, Verträge, Buchungen und Belege — geordnet in einer App. Mit Steuer-Vorbereitung und
            KI-Assistent. Im Browser und auf dem iPhone.
          </p>
          <div className="landing-actions">
            <a className="landing-button primary" href="/app/">
              Kostenlos starten
              <IconArrow />
            </a>
            <a className="landing-button secondary" href="#funktionen">
              Funktionen ansehen
            </a>
          </div>
          <div className="landing-stats">
            <div className="stat">
              <strong>Kostenlos</strong>
              <span>Kein Abo nötig</span>
            </div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="stat">
              <strong>DSGVO</strong>
              <span>EU-Server</span>
            </div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="stat">
              <strong>Browser + iPhone</strong>
              <span>Ein Konto</span>
            </div>
          </div>
        </div>

        <div className="mockup-wrap">
          <div className="mockup-glow" aria-hidden="true" />
          <AppMockup />
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="trust-bar" role="list">
        {(
          [
            ["Keine Kreditkarte beim Start", true],
            ["DSGVO-konform · EU-Server", true],
            ["iOS-App im App Store", true],
            ["Browser-basiert · kein Download", true],
          ] as const
        ).map(([text]) => (
          <div className="trust-item" key={text} role="listitem">
            <IconShield />
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* ── FEATURES ── */}
      <section className="landing-section" id="funktionen">
        <div className="section-copy">
          <p className="landing-eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Was die App kann
          </p>
          <h2>Alles, was im Vermieter-Alltag sonst verstreut liegt.</h2>
          <p>Statt Fotos, Tabellen und PDFs zu suchen, hast du alles an der Stelle, an der du es brauchst.</p>
        </div>
        <div className="bento-grid">
          <article className="bento-card bento-wide">
            <div className="bento-icon">
              <IconReceipt />
            </div>
            <h3>Belege & Buchungen</h3>
            <p>
              Scanne Belege, ordne sie Objekten zu und behalte Einnahmen, Ausgaben, Kategorien und Nachweise an einem
              Ort — ohne separate Tabellen.
            </p>
            <div className="bento-chip">Scan · Kategorisieren · Archiv</div>
          </article>
          <article className="bento-card">
            <div className="bento-icon">
              <IconHome />
            </div>
            <h3>Objekte & Einheiten</h3>
            <p>Verwalte Immobilien, Wohneinheiten, Mieter und Mietverträge mit allen relevanten Daten geordnet an einem Ort.</p>
          </article>
          <article className="bento-card">
            <div className="bento-icon">
              <IconTax />
            </div>
            <h3>Steuer-Helfer</h3>
            <p>AfA, Fahrtkosten, Nebenkosten und Anlage-V-Vorbereitung werden direkt aus deinen erfassten Daten strukturiert.</p>
          </article>
          <article className="bento-card bento-accent">
            <div className="bento-icon bento-icon-dark">
              <IconAI />
            </div>
            <h3>KI-Assistent</h3>
            <p>Lass Belege erklären, Dokumente durchsuchen und Fragen zu deinen Objekt- und Buchungsdaten beantworten.</p>
            <div className="bento-chip dark">KI-gestützt</div>
          </article>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="landing-section" id="ablauf">
        <div className="section-copy">
          <p className="landing-eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Wie es funktioniert
          </p>
          <h2>In vier Schritten zur geordneten Verwaltung.</h2>
        </div>
        <div className="steps-grid">
          {(
            [
              ["01", "Objekt anlegen", "Adresse, Einheiten und Rahmendaten erfassen. Fotos optional direkt hochladen."],
              ["02", "Mieter verbinden", "Mieter anlegen, Vertrag erstellen, Mietbeginn und monatliche Miete hinterlegen."],
              ["03", "Belege sammeln", "Foto hochladen, Kategorie prüfen, Betrag bestätigen und der Buchung zuordnen."],
              ["04", "Auswerten", "Jahreszahlen, Kostenblöcke und Anlage-V-Reports jederzeit abrufen oder exportieren."],
            ] as const
          ).map(([n, title, text]) => (
            <div className="step-card" key={n}>
              <span className="step-number" aria-hidden="true">{n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="landing-section" id="abos">
        <div className="section-copy">
          <p className="landing-eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Abo-Modelle
          </p>
          <h2>Starte kostenlos. Schalte frei, wenn du es brauchst.</h2>
          <p>
            Preise und Laufzeiten werden vor dem Kauf transparent im Apple App Store angezeigt. Basis und Pro sind als
            Monats- oder Jahresabo verfügbar.
          </p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={`pricing-card${plan.featured ? " featured" : ""}`} key={plan.name}>
              {plan.featured && <div className="pricing-featured-badge">Beliebt</div>}
              <div className="pricing-head">
                <span className="pricing-tag">{plan.tag}</span>
                <h3>{plan.name}</h3>
                <p>{plan.desc}</p>
              </div>
              <ul className="pricing-list">
                {plan.items.map((item) => (
                  <li key={item}>
                    <IconCheck dark={plan.featured} />
                    {item}
                  </li>
                ))}
              </ul>
              <a className={`pricing-cta${plan.featured ? " featured-cta" : ""}`} href="/app/">
                Kostenlos starten
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="landing-section" id="faq">
        <div className="section-copy">
          <p className="landing-eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Häufige Fragen
          </p>
          <h2>Noch offene Fragen?</h2>
        </div>
        <div className="faq-grid">
          {faqs.map(([q, a]) => (
            <div className="faq-item" key={q}>
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="final-cta">
        <div className="final-cta-inner">
          <p className="landing-eyebrow" style={{ justifyContent: "center" }}>
            <span className="eyebrow-dot" aria-hidden="true" />
            Jetzt loslegen
          </p>
          <h2>Deine Immobilien. Endlich geordnet.</h2>
          <p>Kostenlos starten — ohne Kreditkarte, ohne Abo-Zwang. Upgrade jederzeit möglich.</p>
          <div className="landing-actions" style={{ justifyContent: "center" }}>
            <a className="landing-button primary" href="/app/">
              Web-App öffnen
              <IconArrow />
            </a>
            <a className="landing-button secondary" href="/privacy.html">
              Datenschutz lesen
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              <LogoMark size={32} />
              eypassiai
            </a>
            <p>Immobilienverwaltung für private Vermieter in Deutschland.</p>
            <span className="footer-domain">eypassiai.com</span>
          </div>
          <div className="footer-col">
            <strong>App</strong>
            <a href="/app/">Web-App öffnen</a>
            <a href="#abos">Abo-Modelle</a>
          </div>
          <div className="footer-col">
            <strong>Seite</strong>
            <a href="#funktionen">Funktionen</a>
            <a href="#ablauf">Ablauf</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-col">
            <strong>Rechtliches</strong>
            <a href="/privacy.html">Datenschutz</a>
            <a href="/terms.html">AGB / EULA</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 eypassiai</span>
          <span>eypassiai.com</span>
        </div>
      </footer>
    </main>
  );
}

function AppRuntime() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingSession(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (loadingSession) {
    return <Splash />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <Workspace session={session} user={session.user} />;
}

function Splash() {
  return (
    <main className="center-screen">
      <div className="brand-mark">eypassiai</div>
      <div className="muted">Web-App wird geladen...</div>
    </main>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (result.error) setError(result.error.message);
    else if (mode === "register") setMessage("Konto erstellt. Wenn E-Mail-Bestätigung aktiv ist, prüfe dein Postfach.");
    setBusy(false);
  }

  async function resetPassword() {
    if (!email.trim()) {
      setError("Bitte gib zuerst deine E-Mail ein.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/app/`,
    });
    if (resetError) setError(resetError.message);
    else setMessage("Passwort-E-Mail wurde versendet.");
    setBusy(false);
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <p className="kicker">Browser-Version</p>
        <h1>eypassiai</h1>
        <p>Dieselbe Immobilienverwaltung, dieselben Supabase-User und dieselben Daten wie in deiner iOS-App.</p>
      </section>
      <form className="auth-card" onSubmit={submit}>
        <div>
          <p className="kicker">{mode === "login" ? "Anmelden" : "Registrieren"}</p>
          <h2>{mode === "login" ? "Willkommen zurück" : "Neues Konto"}</h2>
        </div>
        <label>
          E-Mail
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
        </label>
        <label>
          Passwort
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        <button className="primary" disabled={busy || !email || !password}>
          {busy ? "Bitte warten..." : mode === "login" ? "Anmelden" : "Registrieren"}
        </button>
        <div className="auth-actions">
          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Noch kein Konto?" : "Schon registriert?"}
          </button>
          <button type="button" onClick={resetPassword} disabled={busy}>
            Passwort vergessen
          </button>
        </div>
        <p className="fineprint">
          <a href="/privacy.html">Datenschutz</a> · <a href="/terms.html">AGB / EULA</a>
        </p>
      </form>
    </main>
  );
}

function Workspace({ session, user }: { session: Session; user: User }) {
  const [view, setView] = useState<ViewKey>("dashboard");
  const [data, setData] = useState<DataState>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [
        properties,
        units,
        propertyImages,
        unitImages,
        tenants,
        contracts,
        transactions,
        documents,
        travel,
        afa,
        utility,
        portfolio,
        profile,
      ] = await Promise.all([
        supabase.from("properties").select("*").order("created_at", { ascending: false }),
        supabase.from("units").select("*").order("created_at", { ascending: false }),
        supabase.from("property_images").select("*").order("sort_order").order("created_at"),
        supabase.from("unit_images").select("*").order("sort_order").order("created_at"),
        supabase.from("tenants").select("*").order("created_at", { ascending: false }),
        supabase.from("contracts").select("*").order("start_date", { ascending: false }),
        supabase.from("transactions").select("*").order("date", { ascending: false }).limit(250),
        supabase.from("documents").select("*").order("created_at", { ascending: false }),
        supabase.from("travel_expenses").select("*").order("date", { ascending: false }).limit(150),
        supabase.from("afa_positions").select("*").order("start_date", { ascending: false }).limit(150),
        supabase.from("utility_billing").select("*").order("year", { ascending: false }),
        supabase.from("portfolio_entries").select("*").order("snapshot_date", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);

      const results = [
        properties,
        units,
        propertyImages,
        unitImages,
        tenants,
        contracts,
        transactions,
        documents,
        travel,
        afa,
        utility,
        portfolio,
        profile,
      ];
      const firstError = results.find((result) => result.error)?.error;
      if (firstError) throw firstError;

      setData({
        properties: (properties.data ?? []) as PropertyRow[],
        units: (units.data ?? []) as UnitRow[],
        propertyImages: (propertyImages.data ?? []) as PropertyImageRow[],
        unitImages: (unitImages.data ?? []) as UnitImageRow[],
        tenants: (tenants.data ?? []) as TenantRow[],
        contracts: (contracts.data ?? []) as ContractRow[],
        transactions: (transactions.data ?? []) as TransactionRow[],
        documents: (documents.data ?? []) as DocumentRow[],
        travel: (travel.data ?? []) as TravelRow[],
        afa: (afa.data ?? []) as AfaRow[],
        utility: (utility.data ?? []) as UtilityRow[],
        portfolio: (portfolio.data ?? []) as PortfolioRow[],
        profile: (profile.data as ProfileRow | null) ?? null,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [refreshToken]);

  function refresh() {
    setRefreshToken((value) => value + 1);
  }

  const content = {
    dashboard: <Dashboard data={data} setView={setView} />,
    properties: <PropertiesView data={data} user={user} refresh={refresh} />,
    units: <UnitsView data={data} user={user} refresh={refresh} />,
    tenants: <TenantsView data={data} user={user} refresh={refresh} />,
    contracts: <ContractsView data={data} user={user} refresh={refresh} />,
    transactions: <TransactionsView data={data} user={user} refresh={refresh} />,
    receipts: <ReceiptsView data={data} user={user} refresh={refresh} session={session} />,
    documents: <DocumentsView data={data} user={user} refresh={refresh} />,
    travel: <TravelView data={data} user={user} refresh={refresh} />,
    afa: <AfaView data={data} user={user} refresh={refresh} />,
    utility: <UtilityView data={data} user={user} refresh={refresh} />,
    portfolio: <PortfolioView data={data} user={user} refresh={refresh} />,
    ai: <AgentView data={data} user={user} refresh={refresh} />,
    profile: <ProfileView data={data} user={user} refresh={refresh} />,
  } satisfies Record<ViewKey, React.ReactElement>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <strong>eypassiai</strong>
          <span>Web</span>
        </div>
        <nav>
          {nav.map((item) => (
            <button key={item.key} className={view === item.key ? "active" : ""} onClick={() => setView(item.key)}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="kicker">Live verbunden</p>
            <h1>{nav.find((item) => item.key === view)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <button onClick={refresh}>Aktualisieren</button>
            <button onClick={() => supabase.auth.signOut()}>Abmelden</button>
          </div>
        </header>
        {error && <div className="alert error">{error}</div>}
        {loading ? <div className="panel">Daten werden geladen...</div> : content[view]}
      </main>
    </div>
  );
}

function Dashboard({ data, setView }: { data: DataState; setView: (view: ViewKey) => void }) {
  const monthlyRent = data.contracts.reduce((sum, contract) => sum + Number(contract.monthly_rent || 0), 0);
  const currentYear = new Date().getFullYear();
  const yearlyTransactions = data.transactions.filter((tx) => tx.date?.startsWith(String(currentYear)));
  const income = yearlyTransactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + Number(tx.amount), 0);
  const expenses = yearlyTransactions.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + Number(tx.amount), 0);
  const pending = data.transactions.filter((tx) => tx.is_verified === false || tx.import_source === "bulk").length;

  return (
    <section className="stack">
      <div className="metric-grid">
        <Metric label="Objekte" value={String(data.properties.length)} />
        <Metric label="Monatsmiete" value={eur(monthlyRent)} />
        <Metric label={`Einnahmen ${currentYear}`} value={eur(income)} />
        <Metric label={`Ausgaben ${currentYear}`} value={eur(expenses)} />
      </div>
      <div className="panel split-panel">
        <div>
          <p className="kicker">Arbeitsstand</p>
          <h2>{pending > 0 ? `${pending} Belege prüfen` : "Alles aktuell"}</h2>
          <p className="muted">Die Web-App nutzt dieselben Supabase-Tabellen wie deine iOS-App.</p>
        </div>
        <div className="button-row">
          <button className="primary" onClick={() => setView("receipts")}>
            Beleg scannen
          </button>
          <button onClick={() => setView("transactions")}>Buchung erfassen</button>
        </div>
      </div>
      <RecentTransactions transactions={data.transactions.slice(0, 8)} properties={data.properties} />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RecentTransactions({ transactions, properties }: { transactions: TransactionRow[]; properties: PropertyRow[] }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="kicker">Letzte Buchungen</p>
          <h2>Aktivität</h2>
        </div>
      </div>
      <table>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.date}</td>
              <td>{tx.category}</td>
              <td>{properties.find((property) => property.id === tx.property_id)?.address ?? "Ohne Objekt"}</td>
              <td className={tx.amount < 0 ? "negative" : "positive"}>{eur(tx.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PropertiesView({ data, user, refresh }: CrudProps) {
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const image = form.get("image") as File | null;
    const { data: inserted, error } = await supabase.from("properties").insert({
      user_id: user.id,
      address: textValue(form.get("address")),
      type: String(form.get("type") || "Wohnung"),
      purchase_price: numberValue(form.get("purchase_price")),
      purchase_date: textValue(form.get("purchase_date")),
    }).select("id").single();
    if (error) {
      alert(error.message);
      return;
    }
    if (inserted && image && image.size > 0) {
      const imageId = crypto.randomUUID();
      const path = `${userFolder(user.id)}/properties/${inserted.id.toLowerCase()}/${imageId}.${fileExtension(image)}`;
      const imageUrl = await uploadPublicImage("property-images", path, image);
      await supabase.from("property_images").insert({
        id: imageId,
        user_id: user.id,
        property_id: inserted.id,
        image_url: imageUrl,
        storage_path: path,
        sort_order: 0,
      });
      await supabase.from("properties").update({ image_url: imageUrl }).eq("id", inserted.id);
    }
    event.currentTarget.reset();
    refresh();
  }

  return (
    <CrudLayout title="Objekte" subtitle="Immobilien aus derselben Supabase-Tabelle wie iOS." form={<PropertyForm onSubmit={create} />}>
      <CardGrid>
        {data.properties.map((property) => (
          <DataCard
            key={property.id}
            title={property.address}
            meta={property.type}
            mediaUrls={propertyMedia(data, property)}
            onDelete={() => remove("properties", property.id, refresh)}
          >
            <p>Kaufpreis: {eur(property.purchase_price)}</p>
            <p>Kaufdatum: {property.purchase_date ?? "–"}</p>
          </DataCard>
        ))}
      </CardGrid>
    </CrudLayout>
  );
}

function PropertyForm({ onSubmit }: { onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <input name="address" placeholder="Adresse" required />
      <select name="type" defaultValue="Wohnung">
        {propertyTypes.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      <input name="purchase_price" placeholder="Kaufpreis" inputMode="decimal" />
      <input name="purchase_date" type="date" />
      <input name="image" type="file" accept="image/*" />
      <button className="primary">Objekt anlegen</button>
    </form>
  );
}

type CrudProps = {
  data: DataState;
  user: User;
  refresh: () => void;
};

function UnitsView({ data, user, refresh }: CrudProps) {
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const image = form.get("image") as File | null;
    const { data: inserted, error } = await supabase.from("units").insert({
      user_id: user.id,
      property_id: String(form.get("property_id")),
      name: textValue(form.get("name")),
      sqm: numberValue(form.get("sqm")),
      usage_type: String(form.get("usage_type") || "residential"),
    }).select("id").single();
    if (error) {
      alert(error.message);
      return;
    }
    if (inserted && image && image.size > 0) {
      const imageId = crypto.randomUUID();
      const path = `${userFolder(user.id)}/units/${inserted.id.toLowerCase()}/${imageId}.${fileExtension(image)}`;
      const imageUrl = await uploadPublicImage("unit-images", path, image);
      await supabase.from("unit_images").insert({
        id: imageId,
        user_id: user.id,
        unit_id: inserted.id,
        image_url: imageUrl,
        storage_path: path,
        sort_order: 0,
      });
    }
    event.currentTarget.reset();
    refresh();
  }

  return (
    <CrudLayout title="Einheiten" subtitle="Wohnungen, Gewerbe oder Stellplätze." form={<UnitForm data={data} onSubmit={create} />}>
      <CardGrid>
        {data.units.map((unit) => (
          <DataCard
            key={unit.id}
            title={unit.name}
            meta={propertyName(data, unit.property_id)}
            mediaUrls={unitMedia(data, unit)}
            onDelete={() => remove("units", unit.id, refresh)}
          >
            <p>{unit.sqm ?? "–"} m²</p>
            <p>{usageLabel(unit.usage_type)}</p>
          </DataCard>
        ))}
      </CardGrid>
    </CrudLayout>
  );
}

function UnitForm({ data, onSubmit }: { data: DataState; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <select name="property_id" required>
        <option value="">Objekt wählen</option>
        {data.properties.map((property) => (
          <option key={property.id} value={property.id}>
            {property.address}
          </option>
        ))}
      </select>
      <input name="name" placeholder="Einheit, z. B. Wohnung 1" required />
      <input name="sqm" placeholder="m²" inputMode="decimal" />
      <select name="usage_type" defaultValue="residential">
        <option value="residential">Wohnen</option>
        <option value="commercial">Gewerbe</option>
        <option value="mixed">Gemischt</option>
        <option value="parking">Stellplatz</option>
      </select>
      <input name="image" type="file" accept="image/*" />
      <button className="primary">Einheit anlegen</button>
    </form>
  );
}

function TenantsView({ data, user, refresh }: CrudProps) {
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const image = form.get("image") as File | null;
    const { data: inserted, error } = await supabase.from("tenants").insert({
      user_id: user.id,
      property_id: String(form.get("property_id")),
      name: textValue(form.get("name")),
      email: textValue(form.get("email")),
      phone: textValue(form.get("phone")),
      sqm: numberValue(form.get("sqm")),
    }).select("id").single();
    if (error) {
      alert(error.message);
      return;
    }
    if (inserted && image && image.size > 0) {
      const path = `${userFolder(user.id)}/tenants/${inserted.id.toLowerCase()}.${fileExtension(image)}`;
      const imageUrl = await uploadPublicImage("tenant-images", path, image);
      await supabase.from("tenants").update({ profile_image_url: imageUrl }).eq("id", inserted.id);
    }
    event.currentTarget.reset();
    refresh();
  }

  return (
    <CrudLayout title="Mieter" subtitle="Kontakte und Zuordnung zu Objekten." form={<TenantForm data={data} onSubmit={create} />}>
      <CardGrid>
        {data.tenants.map((tenant) => (
          <DataCard
            key={tenant.id}
            title={tenant.name}
            meta={propertyName(data, tenant.property_id)}
            mediaUrls={tenant.profile_image_url ? [tenant.profile_image_url] : []}
            onDelete={() => remove("tenants", tenant.id, refresh)}
          >
            <p>{tenant.email ?? "Keine E-Mail"}</p>
            <p>{tenant.phone ?? "Keine Telefonnummer"}</p>
          </DataCard>
        ))}
      </CardGrid>
    </CrudLayout>
  );
}

function TenantForm({ data, onSubmit }: { data: DataState; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <select name="property_id" required>
        <option value="">Objekt wählen</option>
        {data.properties.map((property) => (
          <option key={property.id} value={property.id}>
            {property.address}
          </option>
        ))}
      </select>
      <input name="name" placeholder="Name" required />
      <input name="email" placeholder="E-Mail optional" type="email" />
      <input name="phone" placeholder="Telefon optional" />
      <input name="sqm" placeholder="m² optional" inputMode="decimal" />
      <input name="image" type="file" accept="image/*" />
      <button className="primary">Mieter anlegen</button>
    </form>
  );
}

function ContractsView({ data, user, refresh }: CrudProps) {
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await supabase.from("contracts").insert({
      user_id: user.id,
      tenant_id: String(form.get("tenant_id")),
      unit_id: textValue(form.get("unit_id")),
      start_date: textValue(form.get("start_date")) || today(),
      end_date: textValue(form.get("end_date")),
      monthly_rent: numberValue(form.get("monthly_rent")) ?? 0,
      deposit: numberValue(form.get("deposit")),
      notes: textValue(form.get("notes")),
      lease_purpose: String(form.get("lease_purpose") || "residential"),
      vat_option: String(form.get("vat_option") || "tax_exempt"),
      vat_rate: numberValue(form.get("vat_rate")) ?? 0,
    });
    event.currentTarget.reset();
    refresh();
  }

  return (
    <CrudLayout title="Verträge" subtitle="Mietverhältnisse mit Monatsmiete und Laufzeit." form={<ContractForm data={data} onSubmit={create} />}>
      <CardGrid>
        {data.contracts.map((contract) => (
          <DataCard key={contract.id} title={tenantName(data, contract.tenant_id)} meta={`${eur(contract.monthly_rent)} / Monat`} onDelete={() => remove("contracts", contract.id, refresh)}>
            <p>
              {contract.start_date} bis {contract.end_date ?? "unbefristet"}
            </p>
            <p>Kaution: {eur(contract.deposit)}</p>
          </DataCard>
        ))}
      </CardGrid>
    </CrudLayout>
  );
}

function ContractForm({ data, onSubmit }: { data: DataState; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <select name="tenant_id" required>
        <option value="">Mieter wählen</option>
        {data.tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
      <select name="unit_id">
        <option value="">Einheit optional</option>
        {data.units.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
          </option>
        ))}
      </select>
      <input name="start_date" type="date" defaultValue={today()} required />
      <input name="end_date" type="date" />
      <input name="monthly_rent" placeholder="Monatsmiete" inputMode="decimal" required />
      <input name="deposit" placeholder="Kaution" inputMode="decimal" />
      <select name="lease_purpose" defaultValue="residential">
        <option value="residential">Wohnen</option>
        <option value="commercial">Gewerbe</option>
        <option value="mixed">Gemischt</option>
        <option value="parking">Stellplatz</option>
      </select>
      <select name="vat_option" defaultValue="tax_exempt">
        <option value="tax_exempt">USt-frei</option>
        <option value="opted_taxable">USt-pflichtig</option>
      </select>
      <input name="vat_rate" placeholder="USt-Satz, z. B. 0.19" inputMode="decimal" />
      <input name="notes" placeholder="Notiz" />
      <button className="primary">Vertrag anlegen</button>
    </form>
  );
}

function TransactionsView({ data, user, refresh }: CrudProps) {
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await supabase.from("transactions").insert({
      user_id: user.id,
      property_id: textValue(form.get("property_id")),
      amount: numberValue(form.get("amount")) ?? 0,
      category: String(form.get("category") || "Sonstiges"),
      date: textValue(form.get("date")) || today(),
      notes: textValue(form.get("notes")),
      vendor: textValue(form.get("vendor")),
      is_verified: true,
      import_source: "web",
    });
    event.currentTarget.reset();
    refresh();
  }

  return (
    <CrudLayout title="Buchungen" subtitle="Einnahmen positiv, Ausgaben negativ." form={<TransactionForm data={data} onSubmit={create} />}>
      <TransactionTable data={data} transactions={data.transactions} refresh={refresh} />
    </CrudLayout>
  );
}

function TransactionForm({ data, onSubmit }: { data: DataState; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <select name="property_id">
        <option value="">Ohne Objekt</option>
        {data.properties.map((property) => (
          <option key={property.id} value={property.id}>
            {property.address}
          </option>
        ))}
      </select>
      <input name="amount" placeholder="Betrag, z. B. -49,99" inputMode="decimal" required />
      <select name="category">
        {categories.map((category) => (
          <option key={category}>{category}</option>
        ))}
      </select>
      <input name="date" type="date" defaultValue={today()} />
      <input name="vendor" placeholder="Anbieter / Empfänger" />
      <input name="notes" placeholder="Notiz" />
      <button className="primary">Buchung anlegen</button>
    </form>
  );
}

function ReceiptsView({ data, user, refresh, session }: CrudProps & { session: Session }) {
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanFiles, setScanFiles] = useState<FileList | null>(null);
  const [signedReceipts, setSignedReceipts] = useState<Record<string, string>>({});
  const { consented, grant } = useAiConsent();
  const receiptTransactions = data.transactions.filter((tx) => {
    const text = [tx.category, tx.notes, tx.vendor, tx.date, propertyName(data, tx.property_id)].join(" ").toLowerCase();
    return (tx.receipt_url || tx.import_source === "bulk") && text.includes(query.toLowerCase());
  });

  useEffect(() => {
    let cancelled = false;

    async function signReceipts() {
      const entries = await Promise.all(
        receiptTransactions
          .filter((tx) => tx.receipt_url)
          .map(async (tx) => {
            const signed = await signedStorageUrl("receipts", tx.receipt_url!);
            return [tx.id, signed] as const;
          }),
      );
      if (!cancelled) {
        const resolved: Record<string, string> = {};
        for (const [id, url] of entries) {
          if (url) resolved[id] = url;
        }
        setSignedReceipts(resolved);
      }
    }

    signReceipts();
    return () => {
      cancelled = true;
    };
  }, [receiptTransactions.map((tx) => `${tx.id}:${tx.receipt_url}`).join("|")]);

  async function scan() {
    if (!scanFiles?.length || !consented) return;
    setScanning(true);
    const images = await Promise.all(Array.from(scanFiles).map(bytesToBase64));
    const { data: result, error } = await supabase.functions.invoke("scan-receipt", {
      body: { images },
      headers: { "X-User-Tier": "pro" },
    });
    if (error) alert(error.message);
    else setScanResult(result as ScanResult);
    setScanning(false);
  }

  async function createFromScan() {
    if (!scanResult) return;
    const file = scanFiles?.[0];
    let receiptUrl: string | null = null;
    if (file) {
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (!error) receiptUrl = path;
    }
    await supabase.from("transactions").insert({
      user_id: user.id,
      amount: -(Math.abs(Number(scanResult.amount ?? scanResult.grossAmount ?? 0))),
      category: scanResult.category || "Sonstiges",
      date: scanResult.date || today(),
      notes: scanResult.notes,
      vendor: scanResult.vendor,
      receipt_url: receiptUrl,
      tax_net_amount: scanResult.taxNetAmount,
      vat_rate: scanResult.vatRate,
      vat_amount: scanResult.vatAmount,
      gross_amount: scanResult.grossAmount,
      iban: scanResult.iban,
      bic: scanResult.bic,
      recipient: scanResult.recipient,
      reference: scanResult.reference,
      property_address: scanResult.propertyAddress,
      is_verified: false,
      import_source: "web_scan",
    });
    setScanResult(null);
    refresh();
  }

  return (
    <section className="stack">
      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="kicker">KI-Belegscan</p>
            <h2>Beleg hochladen und Buchung vorbereiten</h2>
          </div>
        </div>
        {!consented ? (
          <AiConsent onAccept={grant} />
        ) : (
          <div className="form-grid">
            <input type="file" accept="image/*" multiple onChange={(event) => setScanFiles(event.currentTarget.files)} />
            <button className="primary" onClick={scan} disabled={!scanFiles?.length || scanning}>
              {scanning ? "Scan läuft..." : "Mit KI scannen"}
            </button>
          </div>
        )}
        {scanResult && (
          <div className="result-box">
            <strong>{scanResult.vendor ?? "Unbekannter Anbieter"}</strong>
            <p>
              {scanResult.date ?? "Kein Datum"} · {eur(scanResult.amount ?? scanResult.grossAmount)}
            </p>
            <p>{scanResult.category ?? "Keine Kategorie"} · {scanResult.notes ?? "Keine Notiz"}</p>
            <button className="primary" onClick={createFromScan}>
              Als Buchung übernehmen
            </button>
          </div>
        )}
        <p className="fineprint">Angemeldet als {session.user.email}. KI-Daten laufen über Supabase Edge Functions und Anthropic.</p>
      </div>
      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="kicker">Belegarchiv</p>
            <h2>Suche und Downloads</h2>
          </div>
          <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Belege suchen" />
        </div>
        <TransactionTable
          data={data}
          transactions={receiptTransactions}
          refresh={refresh}
          showDownloads
          signedReceiptUrls={signedReceipts}
        />
      </div>
    </section>
  );
}

function DocumentsView({ data, user, refresh }: CrudProps) {
  const [query, setQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [chatting, setChatting] = useState(false);
  const { consented, grant } = useAiConsent();
  const filtered = data.documents.filter((doc) =>
    [doc.name, doc.category, propertyName(data, doc.property_id), tenantName(data, doc.tenant_id ?? "")].join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) return;
    const ext = file.type.includes("pdf") ? "pdf" : "jpg";
    const path = `${user.id}/documents/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) {
      alert(error.message);
      return;
    }
    await supabase.from("documents").insert({
      user_id: user.id,
      name: textValue(form.get("name")) || file.name,
      category: textValue(form.get("category")) || "Dokument",
      file_url: publicObjectUrl("documents", path),
      file_size: file.size,
      file_type: file.type,
      property_id: textValue(form.get("property_id")),
      tenant_id: textValue(form.get("tenant_id")),
    });
    event.currentTarget.reset();
    refresh();
  }

  async function askDocuments() {
    if (!chatInput.trim() || !consented) return;
    setChatting(true);
    const documentContext = filtered
      .slice(0, 20)
      .map((doc) => `${doc.name} (${doc.category}, ${propertyName(data, doc.property_id)})`)
      .join("\n");
    const { data: result, error } = await supabase.functions.invoke("doc-chat", {
      body: {
        messages: [{ role: "user", content: chatInput }],
        documentContext,
        documentUrls: [],
      },
    });
    if (error) alert(error.message);
    else setChatAnswer((result as { text: string }).text);
    setChatting(false);
  }

  return (
    <section className="stack">
      <CrudLayout title="Dokumente" subtitle="Upload in denselben Supabase Storage Bucket." form={<DocumentForm data={data} onSubmit={upload} />}>
        <div className="panel-head compact">
          <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Dokumente suchen" />
        </div>
        <CardGrid>
          {filtered.map((doc) => (
            <DataCard
              key={doc.id}
              title={doc.name}
              meta={doc.category}
              mediaUrls={isImageDocument(doc) ? [doc.file_url] : []}
              onDelete={() => removeDocument(doc, refresh)}
            >
              <p>{propertyName(data, doc.property_id)}</p>
              <p>{doc.file_type ?? "Datei"} · {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : "–"}</p>
              <button onClick={() => openSigned("documents", doc.file_url)}>Download</button>
            </DataCard>
          ))}
        </CardGrid>
      </CrudLayout>
      <div className="panel">
        <p className="kicker">Dokumenten-Chat</p>
        <h2>Frage zu deinen Dokumenten</h2>
        {!consented ? <AiConsent onAccept={grant} /> : null}
        <div className="button-row">
          <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Was steht im Mietvertrag?" />
          <button className="primary" onClick={askDocuments} disabled={!consented || chatting}>
            {chatting ? "Denke..." : "Fragen"}
          </button>
        </div>
        {chatAnswer && <div className="result-box">{chatAnswer}</div>}
      </div>
    </section>
  );
}

function DocumentForm({ data, onSubmit }: { data: DataState; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <input name="name" placeholder="Dokumentname" />
      <input name="category" placeholder="Kategorie" defaultValue="Dokument" />
      <select name="property_id">
        <option value="">Objekt optional</option>
        {data.properties.map((property) => (
          <option key={property.id} value={property.id}>{property.address}</option>
        ))}
      </select>
      <select name="tenant_id">
        <option value="">Mieter optional</option>
        {data.tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
        ))}
      </select>
      <input name="file" type="file" required />
      <button className="primary">Dokument hochladen</button>
    </form>
  );
}

function TravelView({ data, user, refresh }: CrudProps) {
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await supabase.from("travel_expenses").insert({
      user_id: user.id,
      property_id: textValue(form.get("property_id")),
      date: textValue(form.get("date")) || today(),
      km: numberValue(form.get("km")) ?? 0,
      purpose: textValue(form.get("purpose")) || "Objektfahrt",
    });
    event.currentTarget.reset();
    refresh();
  }
  return (
    <CrudLayout title="Fahrtkosten" subtitle="Fahrten für Anlage V erfassen." form={<TravelForm data={data} onSubmit={create} />}>
      <CardGrid>
        {data.travel.map((item) => (
          <DataCard key={item.id} title={item.purpose} meta={`${item.km} km · ${item.date}`} onDelete={() => remove("travel_expenses", item.id, refresh)}>
            <p>{propertyName(data, item.property_id)}</p>
          </DataCard>
        ))}
      </CardGrid>
    </CrudLayout>
  );
}

function TravelForm({ data, onSubmit }: { data: DataState; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <select name="property_id">
        <option value="">Objekt optional</option>
        {data.properties.map((property) => (
          <option key={property.id} value={property.id}>{property.address}</option>
        ))}
      </select>
      <input name="date" type="date" defaultValue={today()} />
      <input name="km" placeholder="Kilometer" inputMode="decimal" required />
      <input name="purpose" placeholder="Zweck" required />
      <button className="primary">Fahrt erfassen</button>
    </form>
  );
}

function AfaView({ data, user, refresh }: CrudProps) {
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await supabase.from("afa_positions").insert({
      user_id: user.id,
      property_id: textValue(form.get("property_id")),
      object_name: textValue(form.get("object_name")) || "AfA-Position",
      acquisition_cost: numberValue(form.get("acquisition_cost")) ?? 0,
      useful_life_years: numberValue(form.get("useful_life_years")) ?? 50,
      start_date: textValue(form.get("start_date")) || today(),
    });
    event.currentTarget.reset();
    refresh();
  }
  return (
    <CrudLayout title="AfA" subtitle="Abschreibungspositionen." form={<AfaForm data={data} onSubmit={create} />}>
      <CardGrid>
        {data.afa.map((item) => (
          <DataCard key={item.id} title={item.object_name} meta={propertyName(data, item.property_id)} onDelete={() => remove("afa_positions", item.id, refresh)}>
            <p>Kosten: {eur(item.acquisition_cost)}</p>
            <p>Nutzungsdauer: {item.useful_life_years} Jahre</p>
          </DataCard>
        ))}
      </CardGrid>
    </CrudLayout>
  );
}

function AfaForm({ data, onSubmit }: { data: DataState; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <select name="property_id">
        <option value="">Objekt optional</option>
        {data.properties.map((property) => (
          <option key={property.id} value={property.id}>{property.address}</option>
        ))}
      </select>
      <input name="object_name" placeholder="Objekt / Position" required />
      <input name="acquisition_cost" placeholder="Anschaffungskosten" inputMode="decimal" required />
      <input name="useful_life_years" placeholder="Nutzungsdauer Jahre" inputMode="numeric" defaultValue="50" />
      <input name="start_date" type="date" defaultValue={today()} />
      <button className="primary">AfA anlegen</button>
    </form>
  );
}

function UtilityView({ data, user, refresh }: CrudProps) {
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await supabase.from("utility_billing").upsert({
      user_id: user.id,
      property_id: String(form.get("property_id")),
      year: numberValue(form.get("year")) ?? new Date().getFullYear(),
      line_items: [],
    });
    event.currentTarget.reset();
    refresh();
  }
  return (
    <CrudLayout title="Nebenkosten" subtitle="Jahresdatensätze für NK-Abrechnung." form={<UtilityForm data={data} onSubmit={create} />}>
      <CardGrid>
        {data.utility.map((item) => (
          <DataCard key={item.id} title={`${item.year}`} meta={propertyName(data, item.property_id)} onDelete={() => remove("utility_billing", item.id, refresh)}>
            <p>{item.line_items?.length ?? 0} Positionen</p>
          </DataCard>
        ))}
      </CardGrid>
    </CrudLayout>
  );
}

function UtilityForm({ data, onSubmit }: { data: DataState; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <select name="property_id" required>
        <option value="">Objekt wählen</option>
        {data.properties.map((property) => (
          <option key={property.id} value={property.id}>{property.address}</option>
        ))}
      </select>
      <input name="year" placeholder="Jahr" inputMode="numeric" defaultValue={new Date().getFullYear()} />
      <button className="primary">NK-Jahr anlegen</button>
    </form>
  );
}

function PortfolioView({ data, user, refresh }: CrudProps) {
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await supabase.from("portfolio_entries").insert({
      user_id: user.id,
      property_id: String(form.get("property_id")),
      snapshot_date: textValue(form.get("snapshot_date")) || today(),
      current_value: numberValue(form.get("current_value")) ?? 0,
      annual_income: numberValue(form.get("annual_income")),
      annual_expenses: numberValue(form.get("annual_expenses")),
    });
    event.currentTarget.reset();
    refresh();
  }
  return (
    <CrudLayout title="Portfolio" subtitle="Wert-Snapshots und Renditebasis." form={<PortfolioForm data={data} onSubmit={create} />}>
      <CardGrid>
        {data.portfolio.map((item) => (
          <DataCard key={item.id} title={propertyName(data, item.property_id)} meta={item.snapshot_date} onDelete={() => remove("portfolio_entries", item.id, refresh)}>
            <p>Wert: {eur(item.current_value)}</p>
            <p>Ertrag: {eur(item.annual_income)} · Kosten: {eur(item.annual_expenses)}</p>
          </DataCard>
        ))}
      </CardGrid>
    </CrudLayout>
  );
}

function PortfolioForm({ data, onSubmit }: { data: DataState; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <select name="property_id" required>
        <option value="">Objekt wählen</option>
        {data.properties.map((property) => (
          <option key={property.id} value={property.id}>{property.address}</option>
        ))}
      </select>
      <input name="snapshot_date" type="date" defaultValue={today()} />
      <input name="current_value" placeholder="Aktueller Wert" inputMode="decimal" required />
      <input name="annual_income" placeholder="Jahreseinnahmen" inputMode="decimal" />
      <input name="annual_expenses" placeholder="Jahreskosten" inputMode="decimal" />
      <button className="primary">Snapshot anlegen</button>
    </form>
  );
}

function AgentView({ data, user, refresh }: CrudProps) {
  const [command, setCommand] = useState("");
  const [result, setResult] = useState<{ action_type: string; data: Record<string, unknown> } | null>(null);
  const [busy, setBusy] = useState(false);
  const { consented, grant } = useAiConsent();

  async function send() {
    if (!command.trim() || !consented) return;
    setBusy(true);
    const { data: response, error } = await supabase.functions.invoke("agent-command", {
      body: {
        command,
        context: {
          properties: data.properties,
          tenants: data.tenants,
          contracts: data.contracts,
          categories,
          today: today(),
        },
      },
    });
    if (error) alert(error.message);
    else setResult(response as { action_type: string; data: Record<string, unknown> });
    setBusy(false);
  }

  async function applyResult() {
    if (!result) return;
    if (result.action_type === "create_transaction") {
      await supabase.from("transactions").insert({
        user_id: user.id,
        ...result.data,
        is_verified: false,
        import_source: "web_agent",
      });
    }
    if (result.action_type === "create_travel_expense") {
      await supabase.from("travel_expenses").insert({ user_id: user.id, ...result.data });
    }
    setResult(null);
    setCommand("");
    refresh();
  }

  return (
    <section className="stack">
      <div className="panel">
        <p className="kicker">KI-Assistent</p>
        <h2>Buchungen und Fahrten per Text vorbereiten</h2>
        {!consented ? <AiConsent onAccept={grant} /> : null}
        <div className="button-row">
          <input value={command} onChange={(event) => setCommand(event.target.value)} placeholder="z. B. Miete von Anna für Mai buchen" />
          <button className="primary" onClick={send} disabled={!consented || busy}>
            {busy ? "Denke..." : "Vorschlag"}
          </button>
        </div>
        {result && (
          <div className="result-box">
            <strong>{result.action_type}</strong>
            <pre>{JSON.stringify(result.data, null, 2)}</pre>
            <button className="primary" onClick={applyResult}>Übernehmen</button>
          </div>
        )}
      </div>
    </section>
  );
}

function ProfileView({ data, user, refresh }: CrudProps) {
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await supabase.from("profiles").upsert({
      id: user.id,
      display_name: textValue(form.get("display_name")),
      avatar_url: data.profile?.avatar_url ?? null,
    });
    refresh();
  }
  return (
    <section className="stack">
      <div className="panel">
        <p className="kicker">Profil</p>
        <h2>{data.profile?.display_name || user.email}</h2>
        <p className="muted">User-ID: {user.id}</p>
        <form className="form-grid" onSubmit={save}>
          <input name="display_name" defaultValue={data.profile?.display_name ?? ""} placeholder="Anzeigename" />
          <button className="primary">Speichern</button>
        </form>
      </div>
    </section>
  );
}

function TransactionTable({
  data,
  transactions,
  refresh,
  showDownloads = false,
  signedReceiptUrls = {},
}: {
  data: DataState;
  transactions: TransactionRow[];
  refresh: () => void;
  showDownloads?: boolean;
  signedReceiptUrls?: Record<string, string>;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {showDownloads ? <th>Vorschau</th> : null}
            <th>Datum</th>
            <th>Kategorie</th>
            <th>Objekt</th>
            <th>Anbieter</th>
            <th>Betrag</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              {showDownloads ? (
                <td className="preview-cell">
                  <ReceiptPreview tx={tx} signedUrl={signedReceiptUrls[tx.id]} />
                </td>
              ) : null}
              <td>{tx.date}</td>
              <td>{tx.category}</td>
              <td>{propertyName(data, tx.property_id)}</td>
              <td>{tx.vendor ?? tx.notes ?? "–"}</td>
              <td className={tx.amount < 0 ? "negative" : "positive"}>{eur(tx.amount)}</td>
              <td>
                <div className="mini-actions">
                  {showDownloads && tx.receipt_url ? <button onClick={() => openReceipt(tx, signedReceiptUrls[tx.id])}>Öffnen</button> : null}
                  <button onClick={() => remove("transactions", tx.id, refresh)}>Löschen</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReceiptPreview({ tx, signedUrl }: { tx: TransactionRow; signedUrl?: string }) {
  if (!tx.receipt_url) return <span>–</span>;
  if (!signedUrl) return <span className="tiny-muted">lädt</span>;
  if (isImageUrl(tx.receipt_url) || isImageUrl(signedUrl)) {
    return <img src={signedUrl} alt={`Beleg ${tx.date}`} loading="lazy" />;
  }
  if (isPdfUrl(tx.receipt_url) || isPdfUrl(signedUrl)) {
    return <span className="pdf-badge">PDF</span>;
  }
  return <span className="file-badge">Datei</span>;
}

function CrudLayout({ title, subtitle, form, children }: { title: string; subtitle: string; form: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="stack">
      <div className="panel">
        <p className="kicker">{title}</p>
        <h2>{subtitle}</h2>
        {form}
      </div>
      <div className="panel">{children}</div>
    </section>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="card-grid">{children}</div>;
}

function DataCard({
  title,
  meta,
  children,
  mediaUrls = [],
  onDelete,
}: {
  title: string;
  meta: string;
  children: React.ReactNode;
  mediaUrls?: string[];
  onDelete: () => void;
}) {
  const visibleMedia = mediaUrls.filter(Boolean).slice(0, 4);
  return (
    <article className="data-card">
      {visibleMedia.length > 0 ? <MediaStrip urls={visibleMedia} title={title} /> : null}
      <div>
        <h3>{title}</h3>
        <span>{meta}</span>
      </div>
      <div className="card-body">{children}</div>
      <button className="danger" onClick={onDelete}>Löschen</button>
    </article>
  );
}

function MediaStrip({ urls, title }: { urls: string[]; title: string }) {
  return (
    <div className={`media-strip count-${Math.min(urls.length, 4)}`}>
      {urls.map((url, index) => (
        <img key={`${url}-${index}`} src={url} alt={`${title} Bild ${index + 1}`} loading="lazy" />
      ))}
    </div>
  );
}

function AiConsent({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="consent">
      <strong>KI-Datenfreigabe erforderlich</strong>
      <p>
        Für diese Funktion werden die ausgewählten Texte, Bilder oder Dokumentinformationen an eine Supabase Edge Function und
        Anthropic PBC gesendet, um Belege zu erkennen oder Fragen zu beantworten. Ohne Zustimmung werden keine KI-Daten übertragen.
      </p>
      <button className="primary" onClick={onAccept}>Ich stimme zu</button>
    </div>
  );
}

async function remove(table: string, id: string, refresh: () => void) {
  if (!window.confirm("Wirklich löschen?")) return;
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) alert(error.message);
  refresh();
}

async function removeDocument(doc: DocumentRow, refresh: () => void) {
  if (!window.confirm("Dokument löschen?")) return;
  const path = storagePathFromUrl("documents", doc.file_url);
  if (path) await supabase.storage.from("documents").remove([path]);
  await supabase.from("documents").delete().eq("id", doc.id);
  refresh();
}

async function openSigned(bucket: string, url: string) {
  const path = storagePathFromUrl(bucket, url);
  if (!path) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) alert(error.message);
  else window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

async function signedStorageUrl(bucket: string, urlOrPath: string) {
  const path = storagePathFromUrl(bucket, urlOrPath);
  if (!path) return urlOrPath;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

async function openReceipt(tx: TransactionRow, signedUrl?: string) {
  if (signedUrl) {
    window.open(signedUrl, "_blank", "noopener,noreferrer");
    return;
  }
  if (tx.receipt_url) await openSigned("receipts", tx.receipt_url);
}

function propertyName(data: DataState, id: string | null | undefined) {
  if (!id) return "Ohne Objekt";
  return data.properties.find((property) => property.id === id)?.address ?? "Unbekanntes Objekt";
}

function propertyMedia(data: DataState, property: PropertyRow) {
  const gallery = data.propertyImages
    .filter((image) => image.property_id === property.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.image_url);
  if (property.image_url && !gallery.includes(property.image_url)) {
    return [property.image_url, ...gallery];
  }
  return gallery;
}

function unitMedia(data: DataState, unit: UnitRow) {
  return data.unitImages
    .filter((image) => image.unit_id === unit.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.image_url);
}

function tenantName(data: DataState, id: string | null | undefined) {
  if (!id) return "Ohne Mieter";
  return data.tenants.find((tenant) => tenant.id === id)?.name ?? "Unbekannter Mieter";
}

function usageLabel(value: string | null | undefined) {
  switch (value) {
    case "commercial":
      return "Gewerbe";
    case "mixed":
      return "Gemischt";
    case "parking":
      return "Stellplatz";
    default:
      return "Wohnen";
  }
}
