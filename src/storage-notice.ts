import "./storage-notice.css";
import { createStorageNoticeState, STORAGE_NOTICE_KEY } from "./storage-notice-state";

const DISCLOSURE_URL = "/privacy.html#browserspeicher";

function mountStorageNotice() {
  // Accessing the localStorage property itself can throw in restricted browsers.
  const state = createStorageNoticeState({
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: key => window.localStorage.removeItem(key),
  });
  const root = document.createElement("div");
  root.className = "storage-notice-root";
  root.innerHTML = `
    <div class="storage-notice-space" aria-hidden="true"></div>
    <div class="storage-notice-dock">
      <section class="storage-notice-banner" aria-labelledby="storage-notice-title">
        <div class="storage-notice-copy">
          <h2 id="storage-notice-title">Cookies &amp; Browserspeicher</h2>
          <p>Wir verwenden Browserspeicher für die Anmeldung, deine gesonderte KI-Freigabe und diesen Hinweis. Keine Analyse- oder Werbeskripte. „Verstanden“ blendet nur den Hinweis aus.</p>
        </div>
        <div class="storage-notice-actions">
          <a class="storage-notice-details" href="${DISCLOSURE_URL}" data-storage-details aria-haspopup="dialog" aria-controls="storage-notice-dialog">Details</a>
          <button class="storage-notice-acknowledge" type="button">Verstanden</button>
        </div>
      </section>
      <a class="storage-notice-reopen" href="${DISCLOSURE_URL}" data-storage-details aria-haspopup="dialog" aria-controls="storage-notice-dialog">Cookies &amp; Browserspeicher</a>
    </div>
    <dialog class="storage-notice-dialog" id="storage-notice-dialog" aria-labelledby="storage-notice-dialog-title" aria-describedby="storage-notice-dialog-summary">
      <div class="storage-notice-dialog-header">
        <h2 id="storage-notice-dialog-title">Cookies &amp; Browserspeicher</h2>
        <button class="storage-notice-close" type="button" autofocus>Schließen</button>
      </div>
      <div class="storage-notice-dialog-content">
        <p id="storage-notice-dialog-summary">Hier erfährst du, welche lokalen Einträge die Web-Anwendung verwendet. Die Website bindet keine Analyse- oder Werbeskripte ein.</p>
        <section aria-labelledby="storage-notice-login-title">
          <h3 id="storage-notice-login-title">Anmeldung in der Web-App</h3>
          <p>Erst beim Laden von <a href="/app/">/app/</a> wird die Web-Anmeldung mit Supabase initialisiert. Die öffentliche Startseite und die Rechtsseiten initialisieren sie nicht.</p>
          <p>Die Anmeldung verwendet <code>localStorage</code> mit dem Schlüssel <code>sb-krrhegbikgusqubxcxbr-auth-token</code>. Er enthält Sitzungsdaten und Authentifizierungstoken, damit die Anmeldung bei weiteren Aufrufen erhalten bleibt. Token werden zur Prüfung und Erneuerung der Sitzung an Supabase gesendet.</p>
          <p>Es gibt keine feste lokale Löschfrist. Bei erfolgreicher Abmeldung wird der Eintrag entfernt; durch Sitzungsinvalidierung kann er seine Nutzbarkeit verlieren, ohne sofort lokal entfernt zu sein. Du kannst ihn außerdem über die Browser-Einstellungen entfernen.</p>
        </section>
        <section aria-labelledby="storage-notice-ai-title">
          <h3 id="storage-notice-ai-title">Gesonderte KI-Freigabe</h3>
          <p>Die von dir ausdrücklich erteilte KI-Freigabe wird in <code>localStorage</code> unter <code>eypassiai.aiConsent.account.&lt;id&gt;</code> dem jeweiligen Konto zugeordnet. Gespeichert werden die Kontokennung, die Freigabeversion und der Zeitpunkt der Freigabe.</p>
          <p>Sie gilt bis zum Widerruf, einem bekannten Kontowechsel oder einer Abmeldung, der Entfernung des Eintrags oder einem Versionswechsel. In der Web-App kannst du sie im <strong>Profil</strong> über „KI-Freigabe widerrufen“ für die Zukunft zurücknehmen.</p>
          <p>„Verstanden“ erteilt oder widerruft keine KI-Freigabe und ersetzt nicht die gesonderte Einwilligung in die KI-Verarbeitung.</p>
        </section>
        <section aria-labelledby="storage-notice-preference-title">
          <h3 id="storage-notice-preference-title">Diesen Hinweis ausblenden</h3>
          <p>Erst mit „Verstanden“ speichern wir unter <code>eypassiai.storageNotice</code> ausschließlich die Hinweisversion und den Bestätigungszeitpunkt, ohne Nutzerkennung. Das ist eine Ausblendepräferenz, keine Datenschutz- oder KI-Einwilligung.</p>
          <p>Die Präferenz ist höchstens 180 Tage gültig. Beim nächsten Aufruf wird ein abgelaufener oder ungültiger Eintrag ignoriert und seine Entfernung versucht. Bei geschlossenem Browser findet keine automatische Löschung statt. Bei gesperrtem Browserspeicher lässt sich der Hinweis trotzdem für den aktuellen Seitenaufruf schließen.</p>
        </section>
        <p>Lokale Website-Daten kannst du in den Einstellungen deines Browsers entfernen. Das kann die lokale Anmeldung und KI-Freigabe entfernen; dein Konto und dessen Daten auf dem Server werden dadurch nicht gelöscht.</p>
        <a class="storage-notice-privacy" href="${DISCLOSURE_URL}">Zur Datenschutzerklärung</a>
      </div>
    </dialog>
  `;
  document.body.append(root);

  const banner = root.querySelector<HTMLElement>(".storage-notice-banner")!;
  const dock = root.querySelector<HTMLElement>(".storage-notice-dock")!;
  const space = root.querySelector<HTMLElement>(".storage-notice-space")!;
  const dialog = root.querySelector<HTMLDialogElement>("dialog")!;
  const closeButton = root.querySelector<HTMLButtonElement>(".storage-notice-close")!;
  let returnFocusTo: HTMLElement | null = null;

  function reserveDockSpace() {
    space.style.height = `${Math.ceil(dock.getBoundingClientRect().height)}px`;
  }

  function renderBanner() {
    banner.hidden = state.isDismissed();
    reserveDockSpace();
  }

  function openDetails(trigger: HTMLElement) {
    if (typeof dialog.showModal !== "function") return false;
    if (dialog.open) return true;
    try {
      returnFocusTo = trigger;
      dialog.showModal();
      closeButton.focus({ preventScroll: true });
      return true;
    } catch {
      returnFocusTo = null;
      return false; // The anchor still navigates to the full disclosure.
    }
  }

  root.querySelector<HTMLButtonElement>(".storage-notice-acknowledge")!.addEventListener("click", () => {
    state.dismiss();
    renderBanner();
    root.querySelector<HTMLAnchorElement>(".storage-notice-reopen")!.focus({ preventScroll: true });
  });
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    if (returnFocusTo?.isConnected) returnFocusTo.focus({ preventScroll: true });
    returnFocusTo = null;
  });
  dialog.addEventListener("keydown", event => {
    // Native showModal handles Escape and makes the background inert. Keep Tab
    // cycling within the dialog as well, including browsers with differing defaults.
    if (event.key !== "Tab") return;
    const controls = [...dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex='0']")];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const trigger = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-storage-details]") : null;
    if (trigger && openDetails(trigger)) event.preventDefault();
  });
  window.addEventListener("storage", event => {
    if (event.key === STORAGE_NOTICE_KEY || event.key === null) renderBanner();
  });
  window.addEventListener("resize", reserveDockSpace);
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(reserveDockSpace).observe(dock);
  renderBanner(); // Deliberately does not move focus on page load.
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountStorageNotice, { once: true });
} else {
  mountStorageNotice();
}
