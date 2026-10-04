import Link from 'next/link';
import { BookOpen, ArrowUpRight } from 'lucide-react';
export function Subjects({subjects}:{subjects:{id:string;slug:string;name:string}[]}){return <div className="subject-grid">{subjects.map(s=><Link className="subject-card" href={`/estudar/${s.slug}`} key={s.id}><span className="subject-icon"><BookOpen size={18}/></span><h3>{s.name}</h3><p>Explorar os assuntos <ArrowUpRight size={12} style={{display:'inline'}}/></p></Link>)}</div>;}
