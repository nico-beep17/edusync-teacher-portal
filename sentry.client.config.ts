import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  debug: false,
})