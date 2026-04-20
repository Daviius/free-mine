import Link from "next/link";

export function SiteNav() {
  return (
    <nav className="nav">
      <Link href="/">Home</Link>
      <Link href="/shop">Shop</Link>
      <Link href="/admin">Admin</Link>
    </nav>
  );
}
