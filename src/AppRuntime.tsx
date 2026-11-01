import { useEffect, useState, useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { publicObjectUrl, supabase, supabaseAnonKey, supabaseUrl } from "./supabase";
import { AI_CONSENT_VERSION, createAiConsentStore } from "./ai-consent";
import { buildAgentContext } from "./ai-context";
import { createApprovedAiInvoker } from "./ai-invoke";

const invokeApprovedAi = createApprovedAiInvoker({
  getSession: () => supabase.auth.getSession(),
  supabaseUrl,
  supabaseAnonKey,
});

const aiConsent = createAiConsentStore({
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: key => window.localStorage.removeItem(key),
});

window.addEventListener("storage", event => aiConsent.storageChanged(event.key));

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

function useAiConsent(accountId: string) {
  const consentState = useSyncExternalStore(aiConsent.subscribe, () => aiConsent.getSnapshot(accountId), () => "0:false");
  const consented = consentState.endsWith(":true");
  const [consentError, setConsentError] = useState<string | null>(null);

  function grant() {
    setConsentError(aiConsent.grant(accountId) ? null : "Die Freigabe konnte nicht gespeichert werden. Bitte erlaube den lokalen Browserspeicher und versuche es erneut.");
  }

  function revoke() {
    setConsentError(aiConsent.revoke(accountId) ? null : "Die Freigabe ist für diese Sitzung widerrufen. Der Browser konnte den gespeicherten Eintrag nicht entfernen; lösche vor dem erneuten Öffnen den lokalen Website-Speicher.");
  }

  return { consented, consentState, consentError, grant, revoke, requestApproval: () => aiConsent.requestApproval(accountId) };
}

export default function AppRuntime() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted || authEventReceived) return;
      aiConsent.activateAccount(data.session?.user.id ?? null);
      setSession(data.session);
      setLoadingSession(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      authEventReceived = true;
      aiConsent.activateAccount(nextSession?.user.id ?? null);
      setSession(nextSession);
      setLoadingSession(false);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
      aiConsent.invalidateRequests();
    };
  }, []);

  if (loadingSession) {
    return <Splash />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  // Remount every view on account changes: forms, files, results and loaded records belong to one account.
  return <Workspace key={session.user.id} session={session} user={session.user} />;
}

function Splash() {
  return (
    <main className="center-screen">
      <div className="brand-mark">eypassiai</div>
      <div className="muted">Web-App wird geladen...</div>
    </main>
  );
}

function FilePrivacyNotice() {
  return (
    <aside className="file-privacy-notice" aria-label="Hinweis zum Dateidatenschutz">
      <strong>Hinweis zum Dateidatenschutz</strong>
      <p>Die Dateifunktionen sind derzeit eingeschränkt. Die Dateispeicher wurden privat konfiguriert und zusätzliche Zugriffsbeschränkungen eingerichtet. Die Absicherung bestehender Dateilinks und die vollständige Prüfung sind noch nicht abgeschlossen. Bitte lade keine Dateien hoch und lösche keine gespeicherten Unterlagen. <a href="/privacy.html" target="_blank" rel="noreferrer">Aktueller Prüfstand</a></p>
    </aside>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "register" && !termsAccepted) {
      setError("Bitte akzeptiere vor der Registrierung die AGB.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email, password,
            options: { emailRedirectTo: `${window.location.origin}/app/`, data: { terms_version: "2026-10-30", terms_accepted_at: new Date().toISOString() } },
          });
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
        <FilePrivacyNotice />
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
        {mode === "register" && (
          <div className="stack registration-notices">
            <label className="checkbox-label">
              <input type="checkbox" checked={termsAccepted} onChange={event => setTermsAccepted(event.target.checked)} required />
              <span>Ich akzeptiere die <a href="/terms.html" target="_blank" rel="noreferrer">AGB (Stand 30.10.2026)</a>.</span>
            </label>
            <p className="fineprint">Wie wir deine Daten verarbeiten, steht in der <a href="/privacy.html" target="_blank" rel="noreferrer">Datenschutzerklärung</a>. Für die Verarbeitung personenbezogener Mieterdaten ist vorab ein <a href="/avv.html" target="_blank" rel="noreferrer">Vertrag zur Auftragsverarbeitung</a> mit bestätigten Anlagen abzuschließen.</p>
          </div>
        )}
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        <button className="primary" disabled={busy || !email || !password || (mode === "register" && !termsAccepted)}>
          {busy ? "Bitte warten..." : mode === "login" ? "Anmelden" : "Registrieren"}
        </button>
        <div className="auth-actions">
          <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setTermsAccepted(false); }}>
            {mode === "login" ? "Noch kein Konto?" : "Schon registriert?"}
          </button>
          <button type="button" onClick={resetPassword} disabled={busy}>
            Passwort vergessen
          </button>
        </div>
        <LegalLinks />
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

  async function signOut() {
    aiConsent.activateAccount(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      aiConsent.activateAccount(user.id);
      setError(signOutError.message);
    }
  }

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
            <button onClick={signOut}>Abmelden</button>
          </div>
        </header>
        <FilePrivacyNotice />
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
  const { consented, consentState, consentError, grant, requestApproval } = useAiConsent(user.id);
  useEffect(() => {
    setScanFiles(null);
    setScanResult(null);
    setScanning(false);
  }, [consentState]);
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
    if (!scanFiles?.length) return;
    const approval = requestApproval();
    if (!approval) return;
    setScanning(true);
    try {
      const images = await Promise.all(Array.from(scanFiles).map(bytesToBase64));
      if (!approval.isCurrent()) return;
      const { data: result, error } = await invokeApprovedAi(user.id, approval, "scan-receipt", {
        body: { images },
        headers: { "X-User-Tier": "pro" },
      });
      if (!approval.isCurrent()) return;
      if (error) alert(error.message);
      else setScanResult(result as ScanResult);
    } catch (error) {
      if (approval.isCurrent()) alert(error instanceof Error ? error.message : String(error));
    } finally {
      approval.release();
      if (approval.isCurrent()) setScanning(false);
    }
  }

  async function createFromScan() {
    if (!scanResult || !aiConsent.isApproved(user.id)) return;
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
        {consentError && <p className="alert error" role="alert">{consentError}</p>}
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
        <p className="fineprint">Der Scan sendet die vollständig ausgewählten Belegbilder einschließlich sichtbarer personenbezogener Angaben über Supabase an Anthropic. Angemeldet als {session.user.email}. Die Freigabe kannst du im Profil widerrufen.</p>
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
  const { consented, consentState, consentError, grant, requestApproval } = useAiConsent(user.id);
  useEffect(() => {
    if (!consented) setChatInput("");
    setChatAnswer(null);
    setChatting(false);
  }, [consentState]);
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
    if (!chatInput.trim()) return;
    const approval = requestApproval();
    if (!approval) return;
    setChatting(true);
    const documentContext = filtered
      .slice(0, 20)
      .map((doc) => `${doc.name} (${doc.category}, ${propertyName(data, doc.property_id)})`)
      .join("\n");
    try {
      const { data: result, error } = await invokeApprovedAi(user.id, approval, "doc-chat", {
        body: {
          messages: [{ role: "user", content: chatInput }],
          documentContext,
          documentUrls: [],
        },
      });
      if (!approval.isCurrent()) return;
      if (error) alert(error.message);
      else setChatAnswer((result as { text: string }).text);
    } catch (error) {
      if (approval.isCurrent()) alert(error instanceof Error ? error.message : String(error));
    } finally {
      approval.release();
      if (approval.isCurrent()) setChatting(false);
    }
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
        <p className="fineprint">Gesendet werden deine Frage sowie Name, Kategorie und Objektadresse der ersten 20 Dokumente im aktuellen Suchergebnis. Die Dokumentdateien werden in diesem Web-Chat nicht mitgesendet. Widerruf der KI-Freigabe im Profil.</p>
        {!consented ? <AiConsent onAccept={grant} /> : null}
        {consentError && <p className="alert error" role="alert">{consentError}</p>}
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
  const { consented, consentState, consentError, grant, requestApproval } = useAiConsent(user.id);
  useEffect(() => {
    if (!consented) setCommand("");
    setResult(null);
    setBusy(false);
  }, [consentState]);

  async function send() {
    if (!command.trim()) return;
    const approval = requestApproval();
    if (!approval) return;
    setBusy(true);
    try {
      const { data: response, error } = await invokeApprovedAi(user.id, approval, "agent-command", {
        body: {
          command,
          context: buildAgentContext(data, categories, today()),
        },
      });
      if (!approval.isCurrent()) return;
      if (error) alert(error.message);
      else setResult(response as { action_type: string; data: Record<string, unknown> });
    } catch (error) {
      if (approval.isCurrent()) alert(error instanceof Error ? error.message : String(error));
    } finally {
      approval.release();
      if (approval.isCurrent()) setBusy(false);
    }
  }

  async function applyResult() {
    if (!result || !aiConsent.isApproved(user.id)) return;
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
        <p className="fineprint">Gesendet werden dein Auftrag, die IDs, Adressen und Arten deiner geladenen Objekte, die IDs, Namen und Objektzuordnungen deiner Mieter sowie ihre Vertragszuordnung und Monatsmiete, die Buchungskategorien und das heutige Datum. E-Mail-Adressen, Telefonnummern, Bilder, Vertragsnotizen und Kautionen werden nicht als Kontext mitgesendet. Widerruf der KI-Freigabe im Profil.</p>
        {!consented ? <AiConsent onAccept={grant} /> : null}
        {consentError && <p className="alert error" role="alert">{consentError}</p>}
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
  const { consented, consentError, grant, revoke } = useAiConsent(user.id);
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
      <div className="panel">
        <p className="kicker">Datenschutz</p>
        <h2>KI-Datenfreigabe</h2>
        <p>Die Freigabe gilt nur für dieses Konto in diesem Browser, Version {AI_CONSENT_VERSION}. Bei einem anderen Konto ist eine eigene Freigabe erforderlich.</p>
        {consented ? (
          <div className="stack">
            <p role="status">KI-Funktionen für dieses Konto freigegeben.</p>
            <button className="danger" onClick={revoke}>KI-Freigabe widerrufen</button>
            <p className="fineprint">Der Widerruf sperrt neue KI-Anfragen und verwirft offene KI-Ergebnisse. Bereits versendete Daten lassen sich dadurch nicht zurückholen.</p>
          </div>
        ) : <AiConsent onAccept={grant} />}
        {consentError && <p className="alert error" role="alert">{consentError}</p>}
      </div>
      <div className="panel">
        <h2>Rechtliche Informationen</h2>
        <LegalLinks />
        <p className="fineprint">Für personenbezogene Mieterdaten ist vorab eine Vereinbarung zur Auftragsverarbeitung mit bestätigten Anlagen erforderlich. Die verlinkte AVV ist ein Vertragsentwurf und wird nicht durch einen Login automatisch angenommen.</p>
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

function LegalLinks() {
  return (
    <nav className="legal-links fineprint" aria-label="Rechtliche Informationen">
      <a href="/impressum.html">Impressum</a>
      <a href="/terms.html">AGB / EULA</a>
      <a href="/privacy.html">Datenschutz</a>
      <a href="/avv.html">Auftragsverarbeitung</a>
      <a href="/privacy.html#browserspeicher" data-storage-details>Cookies &amp; Browserspeicher</a>
    </nav>
  );
}

function AiConsent({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="consent">
      <strong>Freiwillige KI-Datenfreigabe für dieses Konto</strong>
      <p>
        Mit deiner Freigabe dürfen die folgenden Daten bei Nutzung der jeweiligen KI-Funktion über Supabase Edge Functions an
        Anthropic PBC zur Verarbeitung gesendet werden. Anthropic ist ein US-Anbieter; dabei kann eine Drittlandübermittlung stattfinden.
      </p>
      <ul>
        <li>Belegscan: die von dir ausgewählten vollständigen Belegbilder mit allen darin sichtbaren Angaben.</li>
        <li>Dokumenten-Chat: deine Frage, Namen, Kategorien und Objektadressen von bis zu 20 Dokumenten im aktuellen Suchergebnis; keine Dokumentdateien.</li>
        <li>KI-Assistent: dein Auftrag, Objekt-IDs, Adressen und Objektarten, Mieter-IDs und Namen mit Objektzuordnung, Vertragszuordnung und Monatsmiete sowie Kategorien und Datum.</li>
      </ul>
      <p>Du kannst die übrige Verwaltung ohne KI-Freigabe nutzen und die Freigabe jederzeit im Profil für die Zukunft widerrufen. Details zu Empfängern, Aufbewahrung und Übermittlungen stehen in der <a href="/privacy.html" target="_blank" rel="noreferrer">Datenschutzerklärung</a>.</p>
      <button className="primary" onClick={onAccept}>KI-Verarbeitung für dieses Konto erlauben</button>
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
