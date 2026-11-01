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

export default function LandingPage() {
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
    ["Sind die Dateifunktionen aktuell verfügbar?", "Die Dateifunktionen sind derzeit eingeschränkt und werden weiter geprüft. Bitte lade keine Dateien hoch und lösche keine gespeicherten Unterlagen. Aktuelle Hinweise findest du in der Datenschutzerklärung."],
    ["Was beinhaltet der kostenlose Plan?", "Du kannst Objekte anlegen, das Interface kennenlernen und dein Profil einrichten — ohne Abo und ohne Kreditkarte. Buchungen und Belege sind Teil der bezahlten Pläne."],
    ["Kann ich jederzeit kündigen?", "Apple-Abos kannst du zum Ende des Abrechnungszeitraums kündigen. Die deutschen Apple-Bedingungen sehen außerdem eine sofortige Kündigung mit anteiliger Erstattung über Apple Support vor. Eine Kontolöschung allein kündigt das Apple-Abo nicht."],
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
              <strong>KI optional</strong>
              <span>Mit Datenfreigabe</span>
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
            ["KI-Funktionen optional", true],
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
              ["01", "Objekt anlegen", "Adresse, Einheiten und Rahmendaten erfassen. Datei-Uploads sind derzeit pausiert."],
              ["02", "Mieter verbinden", "Mieter anlegen, Vertrag erstellen, Mietbeginn und monatliche Miete hinterlegen."],
              ["03", "Buchungen ordnen", "Betrag und Kategorie erfassen und dem passenden Objekt zuordnen. Dateifunktionen sind derzeit eingeschränkt."],
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
            <a href="/impressum.html">Impressum</a>
            <a href="/privacy.html">Datenschutz</a>
            <a href="/terms.html">AGB / EULA</a>
            <a href="/avv.html">Auftragsverarbeitung</a>
            <a href="/privacy.html#browserspeicher" data-storage-details>Cookies &amp; Browserspeicher</a>
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
