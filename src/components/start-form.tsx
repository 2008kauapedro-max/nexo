'use client';
import {useActionState} from 'react';
import {startStudy} from '@/app/actions/study';
export function StartForm({mode='practice',subject,topic,label='Começar treino',target=10}:{mode?:string;subject?:string;topic?:string;label?:string;target?:number}){const[state,action,pending]=useActionState(startStudy,{});return <form action={action}><input type="hidden" name="mode" value={mode}/><input type="hidden" name="target" value={target}/>{subject&&<input type="hidden" name="subject" value={subject}/>} {topic&&<input type="hidden" name="topic" value={topic}/>}<button disabled={pending} className="button primary">{pending?'Preparando…':`${label} →`}</button>{state.error&&<p role="alert" className="notice error" style={{marginTop:12}}>{state.error}</p>}</form>;}
