'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Home,BookOpen,ClipboardList,Sparkles,UserRound} from 'lucide-react';
const items=[{href:'/inicio',label:'Início',icon:Home},{href:'/estudar',label:'Estudar',icon:BookOpen},{href:'/simulados',label:'Simulados',icon:ClipboardList},{href:'/ia',label:'IA',icon:Sparkles},{href:'/perfil',label:'Perfil',icon:UserRound}];
export function Navigation({mobile=false}:{mobile?:boolean}){const path=usePathname();return <nav className={mobile?'bottom-nav':''} aria-label={mobile?'Navegação principal móvel':'Navegação principal'}>{items.map(({href,label,icon:Icon})=><Link key={href} href={href} className={path.startsWith(href)?'active':''} aria-current={path.startsWith(href)?'page':undefined}><Icon size={19}/><span>{label}</span></Link>)}</nav>;}
