import "./globals.css";
import { SupportAuthProvider } from "@/components/SupportAuthProvider";
import { SupportShell } from "@/components/SupportShell";

export const metadata = {
    title: "Enflow | Order Support",
    description: "Support ticket management dashboard for order complaints",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="antialiased bg-[#f8fafc] text-[#0f172a] selection:bg-[#dbae57] selection:text-white">
                <SupportAuthProvider>
                    <SupportShell>
                        {children}
                    </SupportShell>
                </SupportAuthProvider>
            </body>
        </html>
    );
}
