'use client'

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Menu,
  X,
  Heart,
  MessageCircle,
  User,
  Bell,
  Settings,
  Globe,
  HelpCircle,
  Plane,
} from "lucide-react";
/* ============================================================================
 * AirbnbHeader
 * ----------------------------------------------------------------------------
 * Responsive Airbnb-style header with:
 *  - Tabs: Alojamientos, Experiencias, Servicios, Productos (NEW)
 *  - Desktop: expanded search bar with 3 fields (Lugar / Fechas / Viajeros|Tipo)
 *  - Desktop: collapsed search pill (when scrolled)
 *  - Mobile: collapsed pill + tabs
 *  - Mobile: full-screen search modal
 *  - User menu dropdown
 *
 * Drop-in: <AirbnbHeader onSearch={(payload) => fetch(...)} />
 * ========================================================================== */
export type TabId = "alojamientos" | "experiencias" | "servicios" | "productos";
export interface SearchPayload {
  tab: TabId;
  place: string;
  dates: string;
  guests: string;
  /** Only present for "servicios" tab */
  serviceType?: string;
}
export interface AirbnbHeaderProps {
  /** Called when the user clicks any search button (desktop, mobile, modal). */
  onSearch?: (payload: SearchPayload) => void;
  /** Tab change callback. */
  onTabChange?: (tab: TabId) => void;
  /** Menu item callback. */
  onMenuAction?: (action: string) => void;
  /** Initial active tab. */
  defaultTab?: TabId;
  /** Avatar image url. */
  avatarUrl?: string;
  /** Brand label. */
  brand?: string;
}
const TABS: { id: TabId; label: string; emoji: string; isNew?: boolean }[] = [
  { id: "productos", label: "Productos", emoji: "🛍️", isNew: false },
  { id: "alojamientos", label: "Alojamientos", emoji: "🏠" },
  { id: "experiencias", label: "Experiencias", emoji: "🎈", isNew: true },
  { id: "servicios", label: "Servicios", emoji: "🛎️", isNew: true },
];
export default function AirbnbHeader({
  onSearch,
  onTabChange,
  onMenuAction,
  defaultTab = "productos",
  avatarUrl,
  brand = "mercado justo",
}: AirbnbHeaderProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [place, setPlace] = useState("");
  const [dates, setDates] = useState("");
  const [guests, setGuests] = useState("");
  const [serviceType, setServiceType] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  // collapse on scroll (desktop visual change)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const selectTab = (id: TabId) => {
    setActiveTab(id);
    onTabChange?.(id);
  };
  const fireSearch = () => {
    onSearch?.({
      tab: activeTab,
      place,
      dates,
      guests,
      ...(activeTab === "servicios" ? { serviceType } : {}),
    });
  };
  const thirdFieldLabel = activeTab === "servicios" ? "Tipo de servicio" : "Viajeros";
  const thirdFieldPlaceholder =
    activeTab === "servicios" ? "Agregá un servicio" : "¿Cuántos?";
  const thirdFieldValue = activeTab === "servicios" ? serviceType : guests;
  const setThirdFieldValue = activeTab === "servicios" ? setServiceType : setGuests;
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-10">
        {/* ===================== DESKTOP ===================== */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between py-4">
            {/* Brand */}
            <a href="#" className="flex items-center gap-1 text-[#FF385C]">
              <MercadoJustoLogo />
              {!scrolled && (
                <span className="text-2xl font-semibold tracking-tight">{brand}</span>
              )}
            </a>
            {/* Tabs (centered, hidden when scrolled — replaced by compact pill) */}
            {!scrolled && (
              <nav className="flex items-center gap-2">
                {TABS.map((t) => (
                  <TabButton
                    key={t.id}
                    tab={t}
                    active={activeTab === t.id}
                    onClick={() => selectTab(t.id)}
                  />
                ))}
              </nav>
            )}
            {/* Collapsed pill (scrolled state) */}
            {scrolled && (
              <button
                onClick={() => {/* keep visible, no-op */}}
                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow"
              >
                <span className="px-4 text-sm font-medium text-neutral-900 flex items-center gap-2">
                  <span>🏠</span> A cualquier lugar
                </span>
                <span className="h-5 w-px bg-neutral-200" />
                <span className="px-4 text-sm font-medium text-neutral-900">
                  En cualquier momento
                </span>
                <span className="h-5 w-px bg-neutral-200" />
                <span className="px-4 text-sm text-neutral-500">¿Cuántos?</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    fireSearch();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF385C] text-white cursor-pointer"
                  aria-label="Buscar"
                >
                  <Search className="h-4 w-4" />
                </span>
              </button>
            )}
            {/* Right side */}
            <div className="flex items-center gap-2">
              <a
                href="#"
                className="hidden xl:block rounded-full px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
              >
                Convertite en anfitrión
              </a>
              <UserMenuTrigger
                avatarUrl={avatarUrl}
                onClick={() => setMenuOpen((v) => !v)}
              />
              {menuOpen && (
                <div ref={menuRef} className="absolute right-6 top-16 z-50">
                  <UserMenu onAction={(a) => { setMenuOpen(false); onMenuAction?.(a); }} />
                </div>
              )}
            </div>
          </div>
          {/* Expanded search bar (only when not scrolled) */}
          {!scrolled && (
            <div className="pb-5">
              <DesktopSearchBar
                activeTab={activeTab}
                place={place}
                setPlace={setPlace}
                dates={dates}
                setDates={setDates}
                thirdLabel={thirdFieldLabel}
                thirdPlaceholder={thirdFieldPlaceholder}
                thirdValue={thirdFieldValue}
                setThirdValue={setThirdFieldValue}
                onSearch={fireSearch}
              />
            </div>
          )}
        </div>
        {/* ===================== MOBILE ===================== */}
        <div className="lg:hidden py-3">
          {!scrolled ? (
            <>
              {/* Top pill: logo + search + avatar + menu */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileSearchOpen(true)}
                  className="flex flex-1 items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)]"
                >
                  <span className="text-[#FF385C]"><MercadoJustoLogo small /></span>
                  <span className="hidden sm:inline text-lg font-semibold text-[#FF385C]">
                    {brand}
                  </span>
                  <Search className="h-4 w-4 text-neutral-900 ml-2" />
                  <span className="text-sm font-semibold text-neutral-900">
                    Empezá tu búsqueda
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Avatar avatarUrl={avatarUrl} />
                  </div>
                </button>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100"
                  aria-label="Menú"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
              {/* Tabs row */}
              <div className="mt-4 flex items-start justify-around">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTab(t.id)}
                    className="flex flex-col items-center gap-1 px-1"
                  >
                    <div className="relative">
                      <span className="text-3xl leading-none">{t.emoji}</span>
                      {t.isNew && (
                        <span className="absolute -right-6 -top-1 rounded-full bg-[#2B3A55] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                          Novedad
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        activeTab === t.id
                          ? "text-neutral-900 border-b-2 border-neutral-900 pb-1"
                          : "text-neutral-500"
                      }`}
                    >
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            // Scrolled: compact pill + tab labels
            <>
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)]"
              >
                <Search className="h-4 w-4 text-neutral-900" />
                <span className="text-sm font-semibold text-neutral-900">
                  Empezá tu búsqueda
                </span>
              </button>
              <div className="mt-2 flex items-center justify-around">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTab(t.id)}
                    className={`text-xs pb-1 ${
                      activeTab === t.id
                        ? "text-neutral-900 font-semibold border-b-2 border-neutral-900"
                        : "text-neutral-500"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
          {/* Mobile user menu sheet */}
          {menuOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/30"
              onClick={() => setMenuOpen(false)}
            >
              <div
                className="absolute right-3 top-16 w-72"
                onClick={(e) => e.stopPropagation()}
              >
                <UserMenu onAction={(a) => { setMenuOpen(false); onMenuAction?.(a); }} />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* ===================== MOBILE SEARCH MODAL ===================== */}
      {mobileSearchOpen && (
        <MobileSearchModal
          activeTab={activeTab}
          onSelectTab={selectTab}
          place={place}
          setPlace={setPlace}
          dates={dates}
          setDates={setDates}
          guests={guests}
          setGuests={setGuests}
          serviceType={serviceType}
          setServiceType={setServiceType}
          onClose={() => setMobileSearchOpen(false)}
          onSearch={() => {
            fireSearch();
            setMobileSearchOpen(false);
          }}
        />
      )}
    </header>
  );
}
/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */
function TabButton({
  tab,
  active,
  onClick,
}: {
  tab: { id: TabId; label: string; emoji: string; isNew?: boolean };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 text-base transition-colors ${
        active ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
      }`}
    >
      <span className="relative text-2xl">
        {tab.emoji}
        {tab.isNew && (
          <span className="absolute -right-8 -top-2 rounded-md bg-[#2B3A55] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
            Novedad
          </span>
        )}
      </span>
      <span className={`font-${active ? "semibold" : "medium"}`}>{tab.label}</span>
      {active && (
        <span className="absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-neutral-900" />
      )}
    </button>
  );
}
function DesktopSearchBar({
  activeTab,
  place,
  setPlace,
  dates,
  setDates,
  thirdLabel,
  thirdPlaceholder,
  thirdValue,
  setThirdValue,
  onSearch,
}: {
  activeTab: TabId;
  place: string;
  setPlace: (v: string) => void;
  dates: string;
  setDates: (v: string) => void;
  thirdLabel: string;
  thirdPlaceholder: string;
  thirdValue: string;
  setThirdValue: (v: string) => void;
  onSearch: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-3xl items-center rounded-full border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]">
      <Field label="Lugar" placeholder="Explorar destinos" value={place} onChange={setPlace} />
      <Divider />
      <Field label="Fechas" placeholder="¿Cuándo?" value={dates} onChange={setDates} />
      <Divider />
      <Field
        label={thirdLabel}
        placeholder={thirdPlaceholder}
        value={thirdValue}
        onChange={setThirdValue}
        last
      />
      <button
        onClick={onSearch}
        aria-label="Buscar"
        className="m-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF385C] text-white transition-transform hover:scale-105"
      >
        <Search className="h-5 w-5" />
      </button>
      {/* tab indicator dot for context */}
      <span className="sr-only">Buscando en {activeTab}</span>
    </div>
  );
}
function Field({
  label,
  placeholder,
  value,
  onChange,
  last,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  last?: boolean;
}) {
  return (
    <label
      className={`flex-1 cursor-text px-6 py-3 rounded-full hover:bg-neutral-50 transition-colors ${
        last ? "" : ""
      }`}
    >
      <div className="text-xs font-semibold text-neutral-900">{label}</div>
      <input
        className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Divider() {
  return <span className="h-8 w-px bg-neutral-200" />;
}
function Avatar({ avatarUrl }: { avatarUrl?: string }) {
  return (
    <span className="block h-8 w-8 overflow-hidden rounded-full bg-neutral-200">
      {avatarUrl ? (
        <img src={avatarUrl} alt="Perfil" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-neutral-500">
          <User className="h-4 w-4" />
        </span>
      )}
    </span>
  );
}
function UserMenuTrigger({
  avatarUrl,
  onClick,
}: {
  avatarUrl?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2 py-1.5 hover:shadow-md transition-shadow"
      aria-label="Menú de usuario"
    >
      <Avatar avatarUrl={avatarUrl} />
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
        <Menu className="h-4 w-4" />
      </span>
    </button>
  );
}
function UserMenu({ onAction }: { onAction: (action: string) => void }) {
  const items = [
    { id: "favoritos", label: "Favoritos", icon: Heart },
    { id: "viajes", label: "Viajes", icon: Plane },
    { id: "mensajes", label: "Mensajes", icon: MessageCircle },
    { id: "perfil", label: "Perfil", icon: User },
    { divider: true } as const,
    { id: "notificaciones", label: "Notificaciones", icon: Bell },
    { id: "configuracion", label: "Configuración de la cuenta", icon: Settings },
    { id: "idiomas", label: "Idiomas y moneda", icon: Globe },
    { id: "ayuda", label: "Centro de ayuda", icon: HelpCircle },
    { divider: true } as const,
    { id: "anfitrion", label: "Convertite en anfitrión", icon: null, highlight: true },
    { id: "invitar", label: "Invitá a un anfitrión", icon: null },
    { id: "coanfitrion", label: "Encontrá un coanfitrión", icon: null },
    { divider: true } as const,
    { id: "logout", label: "Cerrar sesión", icon: null },
  ];
  return (
    <div className="w-72 overflow-hidden rounded-2xl bg-white py-2 shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
      {items.map((it, i) =>
        "divider" in it ? (
          <div key={`d-${i}`} className="my-2 border-t border-neutral-200" />
        ) : (
          <button
            key={it.id}
            onClick={() => onAction(it.id)}
            className={`flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm hover:bg-neutral-50 ${
              it.highlight ? "font-semibold text-neutral-900" : "text-neutral-700"
            }`}
          >
            {it.icon && <it.icon className="h-4 w-4 text-neutral-700" />}
            <span>{it.label}</span>
          </button>
        )
      )}
    </div>
  );
}
function MobileSearchModal({
  activeTab,
  onSelectTab,
  place,
  setPlace,
  dates,
  setDates,
  guests,
  setGuests,
  serviceType,
  setServiceType,
  onClose,
  onSearch,
}: {
  activeTab: TabId;
  onSelectTab: (t: TabId) => void;
  place: string;
  setPlace: (v: string) => void;
  dates: string;
  setDates: (v: string) => void;
  guests: string;
  setGuests: (v: string) => void;
  serviceType: string;
  setServiceType: (v: string) => void;
  onClose: () => void;
  onSearch: () => void;
}) {
  const clearAll = () => {
    setPlace("");
    setDates("");
    setGuests("");
    setServiceType("");
  };
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex flex-1 items-start justify-around">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-2xl">{t.emoji}</span>
              <span
                className={`text-xs ${
                  activeTab === t.id
                    ? "font-semibold text-neutral-900 border-b-2 border-neutral-900 pb-0.5"
                    : "text-neutral-500"
                }`}
              >
                {t.label}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900">¿Dónde?</h2>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3">
            <Search className="h-4 w-4 text-neutral-700" />
            <input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Explorar destinos"
              className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
            />
          </div>
        </div>
        <CollapsedRow
          label="Fechas"
          placeholder="Agregá fechas"
          value={dates}
          onChange={setDates}
        />
        {activeTab === "servicios" ? (
          <CollapsedRow
            label="Tipo de servicio"
            placeholder="Agregá un servicio"
            value={serviceType}
            onChange={setServiceType}
          />
        ) : (
          <CollapsedRow
            label="Viajeros"
            placeholder="Agregá viajeros"
            value={guests}
            onChange={setGuests}
          />
        )}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-5 py-4">
        <button onClick={clearAll} className="text-sm font-semibold underline">
          Borrar todo
        </button>
        <button
          onClick={onSearch}
          className="flex items-center gap-2 rounded-full bg-[#FF385C] px-6 py-3 text-white"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm font-semibold">Buscar</span>
        </button>
      </div>
    </div>
  );
}
function CollapsedRow({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm">
      <span className="text-sm text-neutral-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-1/2 bg-transparent text-right text-sm font-semibold text-neutral-900 placeholder:font-semibold placeholder:text-neutral-900 focus:outline-none"
      />
    </div>
  );
}
function MercadoJustoLogo({ small }: { small?: boolean }) {
  const size = small ? 24 : 32;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16 1c-2.2 0-4 2-4 4.5 0 1.2.5 2.4 1.3 3.8.6 1 1.4 2.2 2.1 3.3.2.3.4.6.6.9.2-.3.4-.6.6-.9.7-1.1 1.5-2.3 2.1-3.3.8-1.4 1.3-2.6 1.3-3.8C20 3 18.2 1 16 1zm0 2c1.1 0 2 1 2 2.5 0 .6-.3 1.5-1 2.7-.4.7-.9 1.5-1 1.7-.1-.2-.6-1-1-1.7-.7-1.2-1-2.1-1-2.7C14 4 14.9 3 16 3zM7.4 14.4c-3.5 0-6.4 3-6.4 6.6 0 2.2 1.2 4.2 3.1 5.3 1 .6 2 .8 3.2.8 1.8 0 3.6-.8 5-2.3 1-1 2-2.4 2.8-3.8.8 1.4 1.8 2.8 2.8 3.8 1.4 1.5 3.2 2.3 5 2.3 1.2 0 2.2-.2 3.2-.8 1.9-1.1 3.1-3.1 3.1-5.3 0-3.6-2.9-6.6-6.4-6.6-2 0-3.9 1-5.1 2.6-.7.9-1.3 1.8-1.7 2.5-.4-.7-1-1.6-1.7-2.5C11.3 15.4 9.4 14.4 7.4 14.4z" />
    </svg>
  );
}
