"use client";
import {useEffect,useRef} from "react";
/** Words sharing a visual line receive the same animation delay. */
export function RevealText({text}:{text:string}) {
 const ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{const el=ref.current;if(!el||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const measure=()=>{let top=-1,line=-1;el.querySelectorAll<HTMLElement>('.line-word').forEach(word=>{if(Math.abs(word.offsetTop-top)>2){top=word.offsetTop;line++;}word.style.setProperty('--line-delay',`${line*60}ms`);});};const observer=new ResizeObserver(measure);observer.observe(el);void document.fonts.ready.then(measure);return()=>observer.disconnect();},[text]);
 return <span className="line-text"><span className="sr-only">{text}</span><span ref={ref} aria-hidden="true">{text.split(' ').map((word,i)=><span key={i} aria-hidden="true"><span className="line-word">{word}</span>{' '}</span>)}</span></span>;
}
