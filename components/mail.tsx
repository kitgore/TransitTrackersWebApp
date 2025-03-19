"use client"

import * as React from "react"
import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  MessagesSquare,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  Users2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AccountSwitcher } from "@/components/account-switcher"
import { MailDisplay } from "@/components/mail-display"
import { MailList } from "@/components/mail-list"
import { Nav } from "@/components/nav"
import { type Mail } from "../src/app/data"
import { useMail } from "../src/app/use-mail"

import { AppSidebar } from "./app-sidebar"
import { useRef, useMemo } from "react"

interface MailProps {
  accounts: {
    label: string
    email: string
    icon: React.ReactNode
  }[]
  mails: Mail[]
  defaultLayout: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
  onLayoutChange?: (sizes: number[]) => void
  onCollapsedChange?: (collapsed: boolean) => void
}


export function Mail({
  accounts,
  mails,
  defaultLayout,
  navCollapsedSize,
  onLayoutChange,
}: MailProps) {
  const [mail] = useMail();
  const isFirstLayout = useRef(true);
  
  // Set default values that respect min/max constraints
  const normalizedLayout = useMemo(() => {
    const defaultSizes = [60, 40]; // Default split
    
    if (!Array.isArray(defaultLayout) || defaultLayout.length !== 2) {
      return defaultSizes;
    }
    
    // Ensure both values are valid numbers and within constraints
    const validSizes = defaultLayout.map(size => {
      if (typeof size !== 'number' || isNaN(size) || size < 30) {
        return 30;
      }
      return size;
    });
    
    // Ensure they add up to 100
    const total = validSizes[0] + validSizes[1];
    return [
      (validSizes[0] / total) * 100,
      (validSizes[1] / total) * 100
    ];
  }, [defaultLayout]);

  return (
    <AppSidebar>
      <TooltipProvider delayDuration={0}>
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(sizes: number[]) => {
            if (isFirstLayout.current) {
              isFirstLayout.current = false;
              return;
            }
            onLayoutChange?.(sizes);
          }}
          className="h-full max-h-screen items-stretch"
        >
          <ResizablePanel
            defaultSize={normalizedLayout[0]}
            minSize={30}
          >
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold">Driver Messaging</h1>
              <TabsList className="ml-auto">
                <TabsTrigger
                  value="all"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Unread
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" />
                </div>
              </form>
            </div>
            <TabsContent value="all" className="m-0">
              <MailList items={mails} />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <MailList items={mails.filter((item) => !item.read)} />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={normalizedLayout[1]}>
          <MailDisplay
            mail={mails.find((item) => item.id === mail.selected) || null}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
    </AppSidebar>
  )
}
