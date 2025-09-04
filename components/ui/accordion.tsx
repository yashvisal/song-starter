"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("w-full space-y-3", className)}
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "rounded-2xl border border-neutral-200 bg-white shadow-sm transition-colors hover:border-neutral-300",
        className,
      )}
      {...props}
    />
  )
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left text-sm font-medium text-neutral-900 transition-colors",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-5 w-5 text-neutral-500 transition-transform group-data-[state=open]:rotate-180 group-data-[state=open]:text-neutral-700" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent(
  { className, isOpen, children, forceMount = true, ...props }:
  React.ComponentProps<typeof AccordionPrimitive.Content> & { isOpen?: boolean }
) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const innerRef = React.useRef<HTMLDivElement | null>(null)
  const [maxHeight, setMaxHeight] = React.useState<number>(0)

  React.useEffect(() => {
    const inner = innerRef.current
    if (!inner) return
    const measure = () => setMaxHeight(inner.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [children, isOpen])

  return (
    <AccordionPrimitive.Content
      ref={containerRef}
      data-slot="accordion-content"
      forceMount={forceMount}
      style={{ maxHeight: isOpen ? maxHeight : 0 }}
      className={cn(
        "overflow-hidden transition-[max-height] duration-300 ease-in-out",
        className,
      )}
      {...props}
    >
      <div ref={innerRef} className="px-4 pb-4 pt-0 text-sm text-neutral-700">
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
