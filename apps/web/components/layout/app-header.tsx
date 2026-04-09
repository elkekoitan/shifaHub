"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Sun, Moon, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApi } from "@/hooks/use-api";

interface AppHeaderProps {
  user: { firstName: string; lastName: string; role: string };
  onLogout: () => void;
}

export function AppHeader({ user, onLogout }: AppHeaderProps) {
  const { data: bildirimler } = useApi<Array<{ id: string; isRead: boolean }>>("/api/bildirim");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("shifahub_theme", next ? "dark" : "light");
  };

  const okunmamis = bildirimler?.filter((b) => !b.isRead).length ?? 0;
  const roleLabel =
    user.role === "egitmen" ? "Egitmen" : user.role === "admin" ? "Admin" : "Danisan";
  const profileHref = user.role === "admin" ? "/admin/sistem" : `/${user.role}/profil`;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 lg:px-6">
      {/* Sol: baslik */}
      <div className="flex items-center gap-3 pl-10 lg:pl-0">
        <span className="text-sm text-muted-foreground">
          Hos geldiniz, <strong className="text-foreground">{user.firstName}</strong>
        </span>
      </div>

      {/* Sag: aksiyonlar */}
      <div className="flex items-center gap-1">
        {/* Tema toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
          aria-label="Tema degistir"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        {/* Bildirimler */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative" asChild>
          <Link href="/bildirim" aria-label="Bildirimler">
            <Bell size={18} />
            {okunmamis > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
              >
                {okunmamis > 9 ? "9+" : okunmamis}
              </Badge>
            )}
          </Link>
        </Button>

        {/* Kullanici menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {user.firstName.charAt(0)}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={profileHref} className="flex items-center gap-2 cursor-pointer">
                <User size={14} /> Profilim
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/bildirim" className="flex items-center gap-2 cursor-pointer">
                <Bell size={14} /> Bildirimler
                {okunmamis > 0 && (
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {okunmamis}
                  </Badge>
                )}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={toggleTheme}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isDark ? "Acik Tema" : "Koyu Tema"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              className="flex items-center gap-2 cursor-pointer text-destructive"
            >
              <LogOut size={14} /> Cikis Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
