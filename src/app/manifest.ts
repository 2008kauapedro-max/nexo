import type {MetadataRoute} from 'next';
import {brand} from '@/config/brand';
export default function manifest():MetadataRoute.Manifest{return{name:brand.name,short_name:brand.name,description:brand.description,start_url:'/inicio',display:'standalone',background_color:'#f7f8f4',theme_color:'#141817',lang:'pt-BR',icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'},{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'maskable'}]};}
