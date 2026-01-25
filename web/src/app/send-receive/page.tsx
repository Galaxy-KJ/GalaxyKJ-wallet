import { Suspense } from "react"
import { SendReceiveScreen } from "@/components/send-receive/send-receive-screen"

export default function SendReceivePage() {
  return (
    <main className="min-h-screen">
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-foreground">Loading...</div>
          </div>
        }
      >
        <SendReceiveScreen />
      </Suspense>
    </main>
  )
}