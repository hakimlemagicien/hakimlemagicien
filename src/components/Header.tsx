import { Menu, MessageCircle } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "الرئيسية", href: "#", active: true },
  { label: "كيف يعمل التقييم", href: "#how" },
  { label: "ماذا ستحصل عليه", href: "#features" },
  { label: "قصص النجاح", href: "#stories" },
  { label: "أسئلة شائعة", href: "#faq" },
];

function Logo() {
  return (
    <a href="#" className="flex items-center gap-2 shrink-0">
      <span className="grid h-11 w-11 max-lg:h-10 max-lg:w-10 place-items-center rounded-xl max-lg:rounded-full bg-primary text-primary-foreground font-black text-2xl max-lg:text-xl">
        H
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-lg max-lg:text-base font-black tracking-tight text-foreground">HAKIM</span>
        <span className="text-[10px] font-bold tracking-[0.25em] text-primary">COACHING</span>
      </span>
    </a>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const whatsapp = "https://wa.me/00000000000";

  return (
    <header className="sticky top-0 z-50 w-full bg-white lg:bg-background/90 border-b border-border/40 lg:border-border/60 lg:backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 lg:h-24 flex items-center justify-between gap-3 max-lg:[direction:ltr] lg:gap-4">
        <Logo />

        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`relative text-[15px] font-bold transition-colors hover:text-primary ${
                item.active ? "text-primary" : "text-foreground"
              }`}
            >
              {item.label}
              {item.active && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full bg-primary" />
              )}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-5 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            تواصل عبر واتساب
          </a>
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="grid h-10 w-10 place-items-center rounded-full border border-border/50 text-[#25D366]"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
          </a>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-border/50 text-foreground"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border bg-background">
          <ul className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-4 py-3 text-base font-bold ${
                    item.active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
