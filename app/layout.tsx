import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['500', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Panel del box',
  description: 'Administración de clases, WODs, miembros y membresías',
};

/**
 * Layout raíz: solo fuentes y estilos globales. El shell con sidebar
 * vive en app/(dashboard)/layout.tsx, que además exige sesión + rol
 * de staff antes de renderizar cualquier página del panel. La página
 * /login queda fuera de ese grupo, sin sidebar.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Aplica el tema guardado ANTES del primer render — si esto
            corriera en un useEffect normal, se vería un parpadeo del
            tema oscuro por defecto cambiando a claro. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('box-admin-theme');
                if (theme === 'light') {
                  document.documentElement.classList.add('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${spaceGrotesk.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
