import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://db629efa5ab5fd4a4bf7ef1be050514f@o4511226264027136.ingest.de.sentry.io/4511343133851728",

  tracesSampleRate: isProd ? 0.05 : 1,

  enableLogs: false,

  sendDefaultPii: false,

  beforeSend(event) {
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    if (event.request?.cookies) {
      event.request.cookies = {};
    }
    if (event.request?.data) {
      event.request.data = "[Filtered]";
    }
    return event;
  },
});
