import "./globals.css";
import NavBar from "@/components/shared/NavBar";
import Footer from "@/components/shared/Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata = {
  title: "HireLoop",
  description: "A modern job hunting portal for seekers, recruiters, and admins",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NavBar />
        <main>{children}</main>
        <Footer />
        <ToastContainer position="top-right" autoClose={3000} theme="dark" pauseOnHover />
      </body>
    </html>
  );
}
