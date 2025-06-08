import Link from 'next/link';
import { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/maintain">Maintenance</Link>
      </nav>

      <main>{children}</main>

      <footer>
        <hr />
        <p>
          &copy; 2025 Calora |{' '}
          <Link href="/impressum">Impressum</Link> |{' '}
          <Link href="/privacy">Datenschutz</Link>
        </p>
      </footer>
    </>
  );
}
