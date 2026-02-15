import "./globals.css";
import Topbar from "./Topbar";

export const metadata = {
  title: "BREZAL FC",
  description: "Panel del club",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Topbar />
        <div className="bz-container">{children}</div>
      </body>
    </html>
  );
}