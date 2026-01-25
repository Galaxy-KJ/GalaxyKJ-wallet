"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { StarBackground } from "@/components/effects/star-background"
import { SendForm } from "@/components/send-receive/send-form"
import { ReceiveForm } from "@/components/send-receive/receive-form"
import { ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"

export function SendReceiveScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const tabFromURL = searchParams?.get("tab") || "send"
  const [activeTab, setActiveTab] = useState(tabFromURL)

  useEffect(() => {
    setActiveTab(tabFromURL)
  }, [tabFromURL])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/send-receive?tab=${value}`, { scroll: false }) 
  }

  return (
    <div className="relative w-full min-h-screen bg-background text-foreground overflow-hidden">
      <StarBackground />

      <div className="relative z-10 container mx-auto px-4 py-6">

        <header className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center">
            <span className="text-white font-medium text-sm">GW</span>
          </div>
          <h1 className="text-lg font-medium">{activeTab === "send" ? "Send Assets" : "Receive Assets"}</h1>
        </header>

        <div className="max-w-md mx-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-transparent mb-6">
              <TabsTrigger
                value="send"
                className="py-2.5 text-sm data-[state=active]:bg-[#7C3AED]/90 data-[state=active]:text-white text-gray-400 rounded-md"
              >
                Send
              </TabsTrigger>
              <TabsTrigger
                value="receive"
                className="py-2.5 text-sm data-[state=active]:bg-[#7C3AED]/90 data-[state=active]:text-white text-gray-400 rounded-md"
              >
                Receive
              </TabsTrigger>
            </TabsList>

            <Card className="border-border bg-card/95 backdrop-blur-sm shadow-xl">
              <TabsContent value="send" className="mt-0">
                <SendForm />
              </TabsContent>

              <TabsContent value="receive" className="mt-0">
                <ReceiveForm />
              </TabsContent>
            </Card>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
