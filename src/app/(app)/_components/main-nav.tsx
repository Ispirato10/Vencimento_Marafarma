"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Home, PlusCircle, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainNavProps {
  isMobile?: boolean;
}

export function MainNav({ isMobile = false }: MainNavProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Painel', icon: Home },
    { href: '/products/new', label: 'Cadastrar Produto', icon: PlusCircle },
    { href: '/reports', label: 'Relatórios', icon: FileText },
    { href: '/settings', label: 'Configurações', icon: Settings },
  ];

  const linkClass = (href: string) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
      pathname === href && 'bg-muted text-primary'
    );
    
  const linkContainer = isMobile ? 'div' : 'nav';

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href} className={linkClass(link.href)}>
          <link.icon className="h-4 w-4" />
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
