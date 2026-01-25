"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  Search,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StarBackground } from "@/components/effects/star-background";
import { AIChatbot } from "@/components/support/ai-chatbot";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function SupportCenter() {
  const router = useRouter();
  const [showChatbot, setShowChatbot] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeTab, setActiveTab] = useState("faq");

  enum Status {
    Resolved = "resolved",
    InProgress = "in-progress",
    Pending = "pending",
  }

  const faqCategories = [
    {
      id: "account",
      title: "Account & Security",
      items: [
        {
          question: "How do I recover my account?",
          answer:
            "To recover your account, you'll need your 12-word seed phrase. Go to the home screen, select 'Recover Wallet' and enter your seed phrase. If you've lost your seed phrase, unfortunately we won't be able to recover your account due to the decentralized nature of the blockchain.",
        },
        {
          question: "How do I activate multi-signature authentication?",
          answer:
            "To activate multi-signature authentication, go to Settings > Security > Multi-signature. Here you can add up to 3 additional addresses that will need to sign transactions that exceed the limit you set. This adds an extra layer of security to your wallet.",
        },
        {
          question: "How do I change my password?",
          answer:
            "To change your password, go to Settings > Security > Change Password. You'll need to enter your current password and then the new password twice to confirm. Remember that this password only protects access to the application, not your funds on the blockchain.",
        },
      ],
    },
    {
      id: "transactions",
      title: "Transactions",
      items: [
        {
          question: "Why is my transaction pending?",
          answer:
            "Transactions can remain pending for several reasons: 1) Congestion on the Stellar network, 2) Insufficient network fee, 3) Connection issues. They will normally resolve within minutes. If it persists for more than an hour, you can contact support.",
        },
        {
          question: "How do I report a suspicious transaction?",
          answer:
            "If you detect a transaction you don't recognize, go to Transaction History, select the suspicious transaction and click 'Report'. Our team will investigate and contact you within 24-48 hours. We also recommend immediately changing your security credentials.",
        },
        {
          question: "How long does a transaction take to complete?",
          answer:
            "Transactions on the Stellar network normally complete in 3-5 seconds. However, during times of high congestion, they can take up to 30 seconds. If your transaction has been pending for more than 10 minutes, contact our support.",
        },
      ],
    },
    {
      id: "features",
      title: "Features",
      items: [
        {
          question: "How do I set up automatic payments?",
          answer:
            "To set up automatic payments, go to the 'Automations' section and select 'New Automation' > 'Payment'. Here you can set the recipient, amount, frequency and other conditions. Payments will execute automatically according to the schedule you set.",
        },
        {
          question: "How do I perform a swap on Stellar?",
          answer:
            "To perform a swap, go to the 'Swap' section in the main menu. Select the asset you want to exchange and the asset you want to receive. Enter the amount and review the quote. If you agree, confirm the transaction. The swap will be performed automatically through the Stellar DEX.",
        },
        {
          question: "What are AI suggestions?",
          answer:
            "AI suggestions are personalized recommendations based on your usage patterns, transaction history, and market conditions. Our AI system analyzes this data to offer you financial optimization opportunities, such as ideal times to buy/sell or saving strategies.",
        },
      ],
    },
  ];

  const supportTickets = [
    {
      id: "TK-001",
      title: "Issue with pending transaction",
      description: "My transaction has been pending for over 2 hours",
      status: "resolved",
      date: "2025-03-10T14:30:00",
      lastUpdate: "2025-03-10T16:45:00",
    },
    {
      id: "TK-002",
      title: "Error configuring multi-signature",
      description: "I can't add the third address for multi-signature",
      status: "in-progress",
      date: "2025-03-11T09:15:00",
      lastUpdate: "2025-03-11T10:20:00",
    },
    {
      id: "TK-003",
      title: "Feature request: XLM staking",
      description:
        "I would like to be able to stake XLM directly from the wallet",
      status: "pending",
      date: "2025-03-12T11:45:00",
      lastUpdate: "2025-03-12T11:45:00",
    },
  ];

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case "resolved":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        );
      case "in-progress":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
          >
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | number | Date): string => {
    const date = new Date(dateString);

    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const filteredFAQs = searchQuery
    ? faqCategories
        .map((category) => ({
          ...category,
          items: category.items.filter(
            (item) =>
              item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        }))
        .filter((category) => category.items.length > 0)
    : faqCategories;

  return (
    <div className="relative w-full min-h-screen bg-background text-foreground overflow-hidden">
      <StarBackground />

      <div className="relative z-10 container mx-auto px-4 py-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Galaxy Wallet Support Center
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Need help? Our AI Assistant is available 24/7
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Button
              className="bg-gradient-to-r from-[#3B82F6] to-[#9333EA] hover:from-[#4F46E5] hover:to-[#7C3AED] shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-300"
              onClick={() => setShowChatbot(true)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Start AI Chat
            </Button>
          </motion.div>
        </header>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search in frequently asked questions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-muted-foreground"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-card/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-foreground mb-4">
                  Help Center
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Tabs
                  defaultValue="faq"
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-muted mb-4">
                    <TabsTrigger
                      value="faq"
                      className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
                    >
                      Frequently Asked Questions
                    </TabsTrigger>
                    <TabsTrigger
                      value="tickets"
                      className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
                    >
                      My Tickets
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="faq" className="mt-0">
                    {searchQuery && filteredFAQs.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No results found for &quot;{searchQuery}&quot;
                        </p>
                        <Button
                          variant="link"
                          className="text-purple-600 dark:text-purple-400 mt-2"
                          onClick={() => setSearchQuery("")}
                        >
                          Clear search
                        </Button>
                      </div>
                    ) : (
                      <Accordion
                        type="single"
                        collapsible
                        className="space-y-4"
                      >
                        {filteredFAQs.map((category) => (
                          <div key={category.id} className="space-y-2">
                            <h3 className="text-md font-medium text-foreground/80">
                              {category.title}
                            </h3>
                            {category.items.map((item, index) => (
                              <AccordionItem
                                key={`${category.id}-${index}`}
                                value={`${category.id}-${index}`}
                                className="border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 overflow-hidden px-4"
                              >
                                <AccordionTrigger className="py-4 text-left hover:no-underline">
                                  <span className="text-foreground font-medium">
                                    {item.question}
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground pb-4">
                                  {item.answer}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </div>
                        ))}
                      </Accordion>
                    )}
                  </TabsContent>

                  <TabsContent value="tickets" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-md font-medium text-foreground">
                          Ticket History
                        </h3>
                        <Button className="bg-gradient-to-r from-[#3B82F6] to-[#9333EA] hover:from-[#4F46E5] hover:to-[#7C3AED] text-sm h-8 shadow-md">
                          New Ticket
                        </Button>
                      </div>

                      {supportTickets.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground text-sm">
                            You don&apos;t have any support tickets
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {supportTickets.map((ticket) => (
                            <Card
                              key={ticket.id}
                              className="border-border bg-muted/30 hover:bg-muted/50 transition-all duration-200 shadow-sm"
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-foreground">
                                        {ticket.title}
                                      </h4>
                                      {getStatusBadge(ticket.status as Status)}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {ticket.description}
                                    </p>
                                    <div className="flex items-center gap-4 mt-3">
                                      <span className="text-xs text-muted-foreground/60">
                                        ID: {ticket.id}
                                      </span>
                                      <span className="text-xs text-muted-foreground/60">
                                        •
                                      </span>
                                      <span className="text-xs text-muted-foreground/60">
                                        Created: {formatDate(ticket.date)}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-500/10"
                                  >
                                    View details
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border bg-card/80 backdrop-blur-sm shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-foreground">
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-border bg-muted/30 hover:bg-muted text-foreground"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Getting Started Guide
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Technical Documentation
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 10L11 14L9 12M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Security Tips
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M6 19C6.63819 16.6928 8.27998 15 12 15C15.72 15 17.3618 16.6928 18 19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/80 backdrop-blur-sm shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-foreground">
                  Video Tutorials
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {[
                    { title: "Advanced Security Setup", duration: "4:32" },
                    { title: "How to Use Automations", duration: "6:15" },
                    {
                      title: "Trading Strategies on Stellar",
                      duration: "8:47",
                    },
                  ].map((video, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/40 hover:bg-muted transition-all duration-200 cursor-pointer group border border-transparent hover:border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="h-6 w-6 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M15 12L10 16.5V7.5L15 12Z"
                              fill="currentColor"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors text-sm">
                            {video.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {video.duration}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/80 backdrop-blur-sm shadow-md overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6">
                  <h3 className="text-lg font-medium mb-2 text-foreground">
                    Need personalized help?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our support team is available 24/7 to help you with any
                    issues.
                  </p>
                  <Button className="bg-foreground text-background hover:bg-foreground/90 transition-all shadow-md">
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showChatbot && <AIChatbot onClose={() => setShowChatbot(false)} />}
      </AnimatePresence>
    </div>
  );
}
