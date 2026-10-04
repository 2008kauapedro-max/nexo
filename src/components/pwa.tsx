'use client';
import {useEffect}from 'react';
export function Pwa(){useEffect(()=>{if('serviceWorker'in navigator&&process.env.NODE_ENV==='production')navigator.serviceWorker.register('/sw.js').catch(()=>{/* Installation is optional; normal online navigation stays available. */});},[]);return null;}
