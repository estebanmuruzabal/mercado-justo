import { useEffect, useRef, useState } from "react";
import { Search, Menu, Home, Sparkles, ConciergeBell, Package, MapPin, Navigation, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
type TabId = "productos" | "alojamientos" | "experiencias" | "servicios";
const TABS: { id: TabId; label: string; icon: typeof Home; badge?: string }[] = [
  { id: "alojamientos", label: "Alojamientos", icon: Home },
  { id: "experiencias", label: "Experiencias", icon: Sparkles, badge: "Próximamente" },
  { id: "servicios", label: "Servicios", icon: ConciergeBell, badge: "Próximamente" },
  { id: "productos", label: "Productos", icon: Package },
];
const ALLOWED_CITY = "Resistencia, Chaco";
const RADIUS_OPTIONS = [5, 10, 15];
export function Header() {
  const [activeTab, setActiveTab] = useState<TabId>("productos");
  const [scrolled, setScrolled] = useState(false);
  const [destino, setDestino] = useState("");
  const [radio, setRadio] = useState<number | null>(null);
  const [openField, setOpenField] = useState<null | "destino" | "radio">(null);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const destinoInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const requestLocation = () => {
    setGeoStatus("Solicitando ubicación...");
    if (!("geolocation" in navigator)) {
      setGeoStatus("Tu navegador no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDestino(`Mi ubicación (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
        setGeoStatus(null);
        setOpenField("radio");
      },
      (err) => setGeoStatus(`No pudimos obtener tu ubicación: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  const trimmed = destino.trim();
  const isAllowed = trimmed.toLowerCase() === ALLOWED_CITY.toLowerCase();
  const showUnavailable = trimmed.length > 0 && !isAllowed && !trimmed.startsWith("Mi ubicación");
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-1 text-[hsl(355,80%,55%)]">
          <svg viewBox="0 0 32 32" className="h-8 w-8 fill-current" aria-hidden>
            <path d="M16 1C7.7 1 1 7.7 1 16s6.7 15 15 15 15-6.7 15-15S24.3 1 16 1zm0 26c-2.4 0-4.1-1.8-4.1-4.1 0-1.3.5-2.4 1.8-4.2.7-1 2.3-3.4 2.3-3.4s1.6 2.4 2.3 3.4c1.3 1.8 1.8 2.9 1.8 4.2 0 2.3-1.7 4.1-4.1 4.1z" />
          </svg>
          <span className="text-2xl font-bold tracking-tight">airbnb</span>
        </a>
        {/* Desktop tabs — hidden when scrolled (collapsed) */}
        <nav
          className={cn(
            "hidden items-center gap-6 transition-all md:flex",
            scrolled && "pointer-events-none -translate-y-2 opacity-0",
          )}
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "group relative flex flex-col items-center gap-1 pb-2 text-sm transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.badge && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[hsl(220,30%,30%)] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                    {t.badge}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{t.label}</span>
                </div>
                {active && <div className="absolute -bottom-0.5 h-0.5 w-full rounded-full bg-foreground" />}
              </button>
            );
          })}
        </nav>
        {/* Right side */}
        <div className="flex items-center gap-3">
          <a href="#" className="hidden text-sm font-medium hover:text-muted-foreground md:block">
            Convertite en anfitrión
          </a>
          <div className="flex items-center gap-1 rounded-full border border-border p-1.5 hover:shadow-md">
            <Menu className="ml-2 h-4 w-4" />
            <div className="h-7 w-7 rounded-full bg-muted" />
          </div>
        </div>
      </div>
      {/* Search bar */}
      <div className={cn("mx-auto px-6 pb-6 transition-all", scrolled ? "max-w-xl pb-4" : "max-w-3xl")}>
        {scrolled ? (
          <button
            onClick={() => {
              setScrolled(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex w-full items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm shadow-sm hover:shadow-md"
          >
            <Search className="h-4 w-4" />
            <span className="font-medium">{destino || "Tu ciudad"}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{radio ? `${radio} km` : "Radio"}</span>
            <span className="ml-auto rounded-full bg-[hsl(355,80%,55%)] p-2 text-white">
              <Search className="h-3.5 w-3.5" />
            </span>
          </button>
        ) : (
          <div className="flex items-stretch rounded-full border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            {/* Destino */}
            <Popover open={openField === "destino"} onOpenChange={(o) => setOpenField(o ? "destino" : null)}>
              <PopoverTrigger asChild>
                <button
                  onClick={() => setTimeout(() => destinoInputRef.current?.focus(), 0)}
                  className="flex-1 rounded-full px-6 py-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="text-xs font-semibold">Destino</div>
                  <input
                    ref={destinoInputRef}
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder="Tu ciudad"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[360px] p-2">
                <button
                  onClick={requestLocation}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted"
                >
                  <div className="rounded-lg bg-[hsl(210,80%,95%)] p-2 text-[hsl(210,80%,45%)]">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Tu ubicación</div>
                    <div className="text-xs text-muted-foreground">
                      Permití al navegador detectar dónde estás
                    </div>
                  </div>
                </button>
                {geoStatus && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">{geoStatus}</div>
                )}
                {showUnavailable && (
                  <div className="mt-1 flex items-start gap-3 rounded-lg bg-[hsl(0,75%,97%)] p-3">
                    <X className="mt-0.5 h-4 w-4 text-[hsl(355,80%,55%)]" />
                    <div className="text-xs text-foreground">
                      Disculpe, no llegamos a tu ciudad todavía. Disculpe las molestias.
                    </div>
                  </div>
                )}
                {isAllowed && (
                  <button
                    onClick={() => {
                      setDestino(ALLOWED_CITY);
                      setOpenField("radio");
                    }}
                    className="mt-1 flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted"
                  >
                    <div className="rounded-lg bg-[hsl(30,80%,95%)] p-2 text-[hsl(30,80%,45%)]">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Resistencia, Chaco</div>
                      <div className="text-xs text-muted-foreground">Ciudad disponible</div>
                    </div>
                  </button>
                )}
              </PopoverContent>
            </Popover>
            <div className="my-2 w-px bg-border" />
            {/* Radio */}
            <Popover open={openField === "radio"} onOpenChange={(o) => setOpenField(o ? "radio" : null)}>
              <PopoverTrigger asChild>
                <button className="flex-1 rounded-full px-6 py-3 text-left transition-colors hover:bg-muted">
                  <div className="text-xs font-semibold">Radio</div>
                  <div
                    className={cn(
                      "text-sm",
                      radio ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {radio ? `${radio} km` : "¿Cuántos km?"}
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[240px] p-2">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  Elegí un radio
                </div>
                {RADIUS_OPTIONS.map((km) => (
                  <button
                    key={km}
                    onClick={() => {
                      setRadio(km);
                      setOpenField(null);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted",
                      radio === km && "bg-muted font-semibold",
                    )}
                  >
                    <span>{km} kilómetros</span>
                    <span className="text-xs text-muted-foreground">~{km * 1000} m</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
            {/* Search button */}
            <div className="flex items-center pr-2">
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-[hsl(355,80%,55%)] text-white hover:bg-[hsl(355,80%,50%)]"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Mobile tabs (below search) */}
      <nav className="flex items-center justify-around border-t border-border px-4 py-3 md:hidden">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 pb-1 text-xs",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t.badge && (
                <span className="absolute -top-2 rounded-full bg-[hsl(220,30%,30%)] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
                  {t.badge}
                </span>
              )}
              <Icon className="h-5 w-5" />
              <span>{t.label}</span>
              {active && <div className="absolute -bottom-0.5 h-0.5 w-8 rounded-full bg-foreground" />}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
