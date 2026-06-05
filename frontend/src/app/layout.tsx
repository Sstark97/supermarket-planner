import React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { CartSidebar } from "@/features/cart/components/CartSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Antigravity Market | Tu Comparador de Supermercados",
	description:
		"Compara precios entre Mercadona, HiperDino, Carrefour, Lidl y Aldi en Las Palmas de Gran Canaria.",
};

export const viewport: Viewport = {
	viewportFit: "cover",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}): React.ReactElement {
	return (
		<html lang="es">
			<body
				className={`${inter.className} bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col`}
			>
				<SessionProvider>
					<ToastProvider>
						<Header />
						<main className="flex-1 pb-16 md:pb-0">{children}</main>
						<CartSidebar />
						<MobileBottomNav />
					</ToastProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
