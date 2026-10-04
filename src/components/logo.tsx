import Link from 'next/link';
import { brand } from '@/config/brand';
export function Logo() { return <Link href="/" className="logo" aria-label={`${brand.name} — início`}><span className="logo-mark" aria-hidden="true">n</span>{brand.name}<span className="logo-dot">.</span></Link>; }
