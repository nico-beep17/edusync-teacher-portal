import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
  debug: false,
})