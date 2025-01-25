import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-8">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl">Samaritan</span>
        </Link>
        <nav className="flex items-center space-x-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            <Github className="h-5 w-5" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            <Twitter className="h-5 w-5" />
          </a>
        </nav>
      </div>
    </header>
  );
}
