import type { ReactNode } from 'react'

// Minimal root layout for the App Router segment. This only wraps the
// embedded Sanity Studio (/studio). The rest of the site continues to use
// the Pages Router (_app.tsx / _document.tsx).
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
