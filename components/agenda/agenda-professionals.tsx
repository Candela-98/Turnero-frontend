"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { FILTER_SCROLL_FADE_PX, FilterOptionGroup, IconButton, ResponsiveDialog } from "@/components/ui";
export type AgendaStaffChoice = {id:number;name:string;condition:string|null};
export function AgendaProfessionals({staff,value,onChange,loading}:{staff:AgendaStaffChoice[];value:string;onChange:(value:string)=>void;loading:boolean}) {
 const [open,setOpen]=useState(false);
 const strip=useRef<HTMLDivElement>(null);
 const options=[{value:"",label:"Todos",pinned:true},...staff.map(s=>({value:String(s.id),label:`${s.name}${s.condition ? ` · ${s.condition}` : ""}`}))];
 const optionLayout=options.map(option=>`${option.value}:${option.label}`).join("\0");
 useLayoutEffect(()=>{
  const row=strip.current?.querySelector<HTMLElement>("[data-filter-options]");
  const checked=row?.querySelector<HTMLInputElement>("input:checked");
  if(!row||!checked)return;
  let rowWidth=row.clientWidth,itemWidth=checked.getBoundingClientRect().width;
  const reveal=()=>{
    const box=row.getBoundingClientRect(),item=checked.getBoundingClientRect();
    const max=Math.max(0,row.scrollWidth-row.clientWidth),fade=FILTER_SCROLL_FADE_PX;
    const left=box.left+(row.scrollLeft>1?fade:0),right=box.right+(max-row.scrollLeft>1?-fade:0);
    if(item.width>box.width-2*fade||item.left<left)row.scrollLeft+=item.left-box.left-fade;
    else if(item.right>right)row.scrollLeft+=item.right-box.right+fade;
    rowWidth=row.clientWidth;itemWidth=checked.getBoundingClientRect().width;
  };
  reveal();
  const resize=new ResizeObserver(()=>{
    if(row.clientWidth!==rowWidth||checked.getBoundingClientRect().width!==itemWidth)reveal();
  });
  resize.observe(row);resize.observe(checked);
  return ()=>resize.disconnect();
 },[value,optionLayout]);
 return <div className="flex min-w-0 items-center gap-2" data-testid="agenda-professionals">
  <div ref={strip} className="min-w-0 flex-1"><FilterOptionGroup label="Profesional" hideLegend layout="scroll" edgeFades value={value} options={options} onValueChange={onChange}/></div>
  {staff.length>8 ? <ResponsiveDialog open={open} onOpenChange={setOpen} title="Buscar profesional" description="Elegí un profesional para consultar su agenda." closeLabel="Cerrar profesionales" trigger={<IconButton label="Buscar profesional" variant="ghost"><Search /></IconButton>}>
   <FilterOptionGroup label="Profesional" searchThreshold={0} searchLabel="Buscar profesional" value={value} options={options} onValueChange={next=>{onChange(next);setOpen(false);}} />
  </ResponsiveDialog> : null}
  {loading ? <span role="status" className="sr-only">Cargando profesionales</span> : null}
 </div>;
}
