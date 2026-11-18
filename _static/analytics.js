// Basic consent mode: load Google's tag only after the visitor allows analytics.
const notice = document.querySelector(".analytics-notice");
const measurementId = notice.dataset.measurementId;
const consentKey = "histoforge-analytics-consent";
const disableKey = `ga-disable-${measurementId}`;
let tagLoaded = false;

function savedConsent() {
  try {
    return localStorage.getItem(consentKey);
  } catch {
    return null;
  }
}

function startAnalytics() {
  // Local builds support the controls without sending visits to the live report.
  if (location.origin !== notice.dataset.origin) return;
  window[disableKey] = false;
  if (tagLoaded) {
    window.gtag("consent", "update", {analytics_storage: "granted"});
    return;
  }
  tagLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    // Keep query strings and gallery fragments out of the analytics page address.
    page_location: location.origin + location.pathname,
    page_referrer: document.referrer ? new URL(document.referrer).origin : "",
  });
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.append(tag);
}

function stopAnalytics() {
  window[disableKey] = true;
  window.gtag?.("consent", "update", {analytics_storage: "denied"});
  for (const name of ["_ga", `_ga_${measurementId.slice(2)}`]) {
    const expired = `${name}=; Max-Age=0; Path=/`;
    document.cookie = expired;
    document.cookie = `${expired}; Domain=${location.hostname}`;
  }
}

function applyConsent(choice) {
  notice.hidden = choice === "granted" || choice === "denied";
  if (choice === "granted") startAnalytics();
  else stopAnalytics();
}

notice.querySelectorAll("[data-analytics-choice]").forEach((button) => {
  button.addEventListener("click", () => {
    const choice = button.dataset.analyticsChoice;
    try {
      localStorage.setItem(consentKey, choice);
    } catch {
      // The current-page choice still works when browser storage is unavailable.
    }
    applyConsent(choice);
  });
});
document.querySelectorAll("[data-analytics-settings]").forEach((button) => {
  button.hidden = false;
  button.addEventListener("click", () => { notice.hidden = false; });
});
document.querySelectorAll("[data-analytics-download]").forEach((link) => {
  link.addEventListener("click", () => {
    if (!tagLoaded || window[disableKey]) return;
    const target = new URL(link.href);
    // This measures a click; GitHub handles the file download itself.
    window.gtag("event", "download_click", {
      file_name: target.pathname.split("/").pop(),
      link_url: target.origin + target.pathname,
    });
  });
});
window.addEventListener("storage", (event) => {
  if (event.key === consentKey || event.key === null) applyConsent(savedConsent());
});
applyConsent(savedConsent());
