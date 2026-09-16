"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { Avatar, Button } from "@/components/ui";
import { useAuth } from "@/components/auth/auth-provider";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function AccountMenu() {
  const { signOut, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  if (!user) return null;
  return <div className="relative"><button aria-expanded={isOpen} aria-haspopup="menu" aria-label="Abrir menú de cuenta" className="rounded-xl focus-visible:outline-focus-ring" onClick={() => setIsOpen((open) => !open)} type="button"><Avatar imageUrl={user.avatar_url} initials={initials(user.name)} name={user.name} size="sm" /></button>{isOpen ? <div aria-label="Menú de cuenta" className="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-outline-variant bg-surface-container-lowest p-2 shadow-floating" role="menu"><p className="px-3 py-2 text-sm font-semibold text-on-surface">{user.name}</p><p className="px-3 pb-2 text-xs text-on-surface-variant">{user.email}</p><Button className="w-full justify-start" onClick={() => void signOut()} role="menuitem" variant="ghost"><LogOut />Cerrar sesión</Button></div> : null}</div>;
}
