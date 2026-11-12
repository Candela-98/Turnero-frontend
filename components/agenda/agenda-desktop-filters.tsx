"use client";
import { useState } from "react";
import { Popover } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { Button, FilterOptionGroup, Select } from "@/components/ui";
import { statusLabels, type AgendaFilters } from "@/lib/appointments/api";
import type { AgendaStaffChoice } from "./agenda-professionals";

export function AgendaDesktopFilters({filters,staff,loading,onChange}:{filters:AgendaFilters;staff:AgendaStaffChoice[];loading:boolean;onChange:(filters:AgendaFilters)=>void}) {
 const [open,setOpen]=useState(false);
 const selected=staff.find(member=>String(member.id)===filters.staff);
 const label=selected ? `${selected.name}${selected.condition ? ` · ${selected.condition}` : ""}` : "Todos los profesionales";
 return <div className="flex min-w-0 flex-wrap items-center gap-2" aria-label="Filtros de agenda">
  <Popover.Root open={open} onOpenChange={setOpen}>
   <Popover.Trigger asChild><Button variant="outline" className="w-64 justify-between text-left font-medium" aria-label={`Profesional: ${label}`} title={label}><span className="min-w-0 truncate">{label}</span><ChevronDown aria-hidden="true" className="shrink-0" /></Button></Popover.Trigger>
   <Popover.Portal><Popover.Content aria-label="Elegir profesional" align="start" sideOffset={6} collisionPadding={16} className="z-40 max-h-[min(60vh,480px)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-soft focus-visible:outline-focus-ring">
    <FilterOptionGroup label="Profesional" value={filters.staff} searchThreshold={0} searchLabel="Buscar profesional" options={[{value:"",label:"Todos los profesionales",pinned:true},...staff.map(member=>({value:String(member.id),label:`${member.name}${member.condition ? ` · ${member.condition}` : ""}`}))]} onValueChange={staff=>{onChange({...filters,staff});setOpen(false);}} />
    {loading ? <p role="status" className="mt-2 text-sm text-on-surface-variant">Cargando profesionales…</p> : null}
   </Popover.Content></Popover.Portal>
  </Popover.Root>
  <div className="w-52"><label htmlFor="agenda-status" className="sr-only">Estado</label><Select id="agenda-status" value={filters.status} onChange={event=>onChange({...filters,status:event.target.value as AgendaFilters["status"]})}>
   <option value="ALL">Todos los estados</option>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
  </Select></div>
 </div>;
}
