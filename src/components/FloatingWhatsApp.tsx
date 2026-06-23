import { MessageCircle } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/971505129019";

export function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل عبر واتساب"
      className="fixed z-[9999] grid place-items-center rounded-full bg-white shadow-[0_8px_24px_-4px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:scale-105 active:scale-95 animate-whatsapp-pulse animate-whatsapp-enter"
      style={{ bottom: 24, right: 20, width: 64, height: 64 }}
    >
      <MessageCircle className="h-8 w-8 text-[#25D366]" strokeWidth={2} />
    </a>
  );
}
