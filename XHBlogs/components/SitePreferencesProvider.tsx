'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
type Scene = 0 | 1; type BackgroundMode = 'effects' | 'video';
type Preferences = {scene:Scene;setScene:(n:Scene)=>void;motion:boolean;setMotion:(v:boolean)=>void;backgroundMode:BackgroundMode;setBackgroundMode:(v:BackgroundMode)=>void;ready:boolean};
const Context=createContext<Preferences>({scene:0,setScene:()=>{},motion:true,setMotion:()=>{},backgroundMode:'effects',setBackgroundMode:()=>{},ready:false});
function save(k:string,v:string){try{localStorage.setItem(k,v);}catch{}}
export function SitePreferencesProvider({children}:{children:ReactNode}){
 const [scene,updateScene]=useState<Scene>(0),[motion,updateMotion]=useState(true),[backgroundMode,updateMode]=useState<BackgroundMode>('effects'),[ready,setReady]=useState(false);
 useEffect(()=>{const m=matchMedia('(prefers-reduced-motion: reduce)');const c=(navigator as Navigator & {connection?:{saveData?:boolean}}).connection;try{updateScene(localStorage.getItem('cybermot-scene')==='1'?1:0);updateMotion(!m.matches&&!c?.saveData&&localStorage.getItem('cybermot-motion')!=='off');updateMode(localStorage.getItem('cybermot-background-mode')==='video'?'video':'effects');}catch{updateMotion(!m.matches&&!c?.saveData);}setReady(true);const sync=()=>{if(m.matches)updateMotion(false);};m.addEventListener('change',sync);return()=>m.removeEventListener('change',sync);},[]);
 return <Context.Provider value={{scene,setScene:n=>{updateScene(n);save('cybermot-scene',String(n));},motion,setMotion:v=>{updateMotion(v);save('cybermot-motion',v?'on':'off');},backgroundMode,setBackgroundMode:v=>{updateMode(v);save('cybermot-background-mode',v);},ready}}>{children}</Context.Provider>;
}
export const useSitePreferences=()=>useContext(Context);

