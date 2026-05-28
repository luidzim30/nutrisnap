import './globals.css';

export const metadata = {
  title: 'NutriSnap - Rastreador Inteligente',
  description: 'Descubra o que seu corpo realmente precisa.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
