"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Clock,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { StarBackground } from "@/components/effects/star-background";
import { NewAutomationForm } from "@/components/automation/new-automation-form";
import { FinancialImpactChart } from "@/components/automation/financial-impact-chart";
import type { Automation } from "@/types/automation";
import { useAutomationExecution } from "@/hooks/use-automation-execution";
import { AutomationCreateForm } from "@/components/automation/automation-create-form";

const automationData: Automation[] = [
  {
    id: "auto-001",
    type: "payment",
    name: "Monthly Rent Payment",
    description: "Send 50 USDC each month to H8K3...L7M2",
    recipient: "H8K3...L7M2",
    asset: "USDC",
    amount: 50,
    frequency: "monthly",
    nextExecution: "2025-04-01T09:00:00",
    active: true,
    createdAt: "2025-03-01T10:15:00",
    executionCount: 2,
    memo: "Rent",
  },
  {
    id: "auto-002",
    type: "swap",
    name: "Automatic XLM to USDC Swap",
    description: "Convert XLM to USDC when the price increases by 5%",
    assetFrom: "XLM",
    assetTo: "USDC",
    amountFrom: 100,
    condition: "price_increase",
    conditionValue: 5,
    active: true,
    createdAt: "2025-03-05T14:30:00",
    executionCount: 1,
    lastExecution: "2025-03-10T11:25:00",
  },
  {
    id: "auto-003",
    type: "rule",
    name: "Low Balance Alert",
    description: "Receive an alert if the balance drops below 100 XLM",
    asset: "XLM",
    threshold: 100,
    action: "alert",
    active: true,
    createdAt: "2025-03-08T16:45:00",
    executionCount: 0,
  },
  {
    id: "auto-004",
    type: "payment",
    name: "Weekly Savings",
    description: "Transfer 10 XLM each week to my savings account",
    recipient: "G7J2...X9P3",
    asset: "XLM",
    amount: 10,
    frequency: "weekly",
    nextExecution: "2025-03-15T12:00:00",
    active: false,
    createdAt: "2025-02-15T09:30:00",
    executionCount: 4,
    memo: "Savings",
  },
  {
    id: "auto-005",
    type: "rule",
    name: "Automatic Buy on Drop",
    description: "Buy 50 XLM if the price drops more than 10%",
    asset: "XLM",
    threshold: -10,
    action: "buy",
    amount: 50,
    active: true,
    createdAt: "2025-03-12T10:20:00",
    executionCount: 0,
  },
];
export function AutomationCenter() {
  const router = useRouter();
  const [showNewForm, setShowNewForm] = useState(false);
  const [showNewSupabase, setShowNewSupabase] = useState(false);
  const [expandedAutomation, setExpandedAutomation] = useState<string | null>(
    null
  );
  const [automations, setAutomations] = useState<Automation[]>(automationData);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(
    null
  );

  // Live Supabase-backed data and actions
  const {
    automations: sbAutomations,
    executions: sbExecutions,
    loading: sbLoading,
    error: sbError,
    toggleActive: sbToggle,
    remove: sbRemove,
    manualExecute: sbManualExecute,
    refresh: sbRefresh,
  } = useAutomationExecution();

  const toggleAutomation = (id: string) => {
    setAutomations(
      automations.map((auto) =>
        auto.id === id ? { ...auto, active: !auto.active } : auto
      )
    );
  };

  const deleteAutomation = (id: string) => {
    if (confirm("Are you sure you want to delete this automation?")) {
      setAutomations(automations.filter((auto) => auto.id !== id));
    }
  };

  const getAutomationIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <Clock className="h-5 w-5 text-blue-400" />;
      case "swap":
        return <RefreshCw className="h-5 w-5 text-purple-400" />;
      case "rule":
        return <Zap className="h-5 w-5 text-yellow-400" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getNextExecutionText = (automation: Automation) => {
    if (automation.type === "payment") {
      return `Next payment: ${formatDate(automation.nextExecution!)}`;
    } else if (automation.type === "swap") {
      return "Executes when the condition is met";
    } else if (automation.type === "rule") {
      return "Activates when the condition is met";
    }
    return "";
  };

  const handleCreateAutomation = (newAutomation: Automation) => {
    const id = `auto-${(automations.length + 1).toString().padStart(3, "0")}`;
    setAutomations([
      ...automations,
      {
        id,
        ...newAutomation,
        active: true,
        createdAt: new Date().toISOString(),
        executionCount: 0,
      },
    ]);
    setShowNewForm(false);
  };

  const handleEditAutomation = (updatedAutomation: Automation) => {
    setAutomations(
      automations.map((auto) =>
        auto.id === updatedAutomation.id
          ? { ...auto, ...updatedAutomation }
          : auto
      )
    );
    setEditingAutomation(null);
  };

  const startEditing = (automation: Automation) => {
    setEditingAutomation(automation);
    setExpandedAutomation(null);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#0D0D22] text-white overflow-hidden">
      <StarBackground />

      <div className="relative z-10 container mx-auto px-4 py-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-white/5"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Automate Your Finances with Galaxy Wallet
              </h1>
              <p className="text-gray-400 mt-1">
                Schedule payments, swaps, and optimize your assets with
                artificial intelligence
              </p>
            </div>
          </div>

          <Button
            className="bg-gradient-to-r from-[#3B82F6] to-[#9333EA] hover:from-[#4F46E5] hover:to-[#7C3AED] shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-300"
            onClick={() => setShowNewForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Automation
          </Button>
          <Button
            variant="outline"
            className="border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
            onClick={() => setShowNewSupabase(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Payment
          </Button>
        </header>

        <AnimatePresence>
          {showNewForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <Card className="border-gray-800 bg-gradient-to-br from-gray-900/90 to-gray-950/90 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gray-300 flex items-center justify-between">
                    <span>Create New Automation</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-gray-800/50"
                      onClick={() => setShowNewForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NewAutomationForm
                    onSubmit={handleCreateAutomation}
                    onCancel={() => setShowNewForm(false)}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showNewSupabase && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <Card className="border-gray-800 bg-gradient-to-br from-gray-900/90 to-gray-950/90 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gray-300 flex items-center justify-between">
                    <span>Create Payment Automation</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-gray-800/50"
                      onClick={() => setShowNewSupabase(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AutomationCreateForm onClose={() => { setShowNewSupabase(false); sbRefresh(); }} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingAutomation && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <Card className="border-gray-800 bg-gradient-to-br from-gray-900/90 to-gray-950/90 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gray-300 flex items-center justify-between">
                    <span>Edit Automation</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-gray-800/50"
                      onClick={() => setEditingAutomation(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NewAutomationForm
                    automation={editingAutomation}
                    isEditing={true}
                    onSubmit={handleEditAutomation}
                    onCancel={() => setEditingAutomation(null)}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Live Supabase-backed automations */}
            <Card className="border-gray-800 bg-gradient-to-br from-gray-900/90 to-gray-950/90 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-300">
                  Your Automations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {sbError && (
                  <div className="text-sm text-red-400 mb-3">{sbError}</div>
                )}
                {sbLoading ? (
                  <div className="text-sm text-gray-400">Loading…</div>
                ) : sbAutomations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No automations yet.</p>
                    <Button
                      variant="link"
                      className="text-purple-400 mt-2"
                      onClick={() => setShowNewSupabase(true)}
                    >
                      Create one
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sbAutomations.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-md bg-gray-900/40 border border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                            {a.type === 'payment' ? (
                              <Clock className="h-4 w-4 text-blue-400" />
                            ) : a.type === 'swap' ? (
                              <RefreshCw className="h-4 w-4 text-purple-400" />
                            ) : (
                              <Zap className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {a.type === 'payment' ? `Pay ${a.amount} ${a.asset} → ${a.recipient?.slice(0,6)}…` : a.type}
                            </div>
                            <div className="text-xs text-gray-500">
                              {a.active ? 'active' : 'inactive'} · {a.next_execute_at ? `next ${new Date(a.next_execute_at).toLocaleString()}` : 'unscheduled'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={a.active} onCheckedChange={(v) => sbToggle(a.id, v)} className="data-[state=checked]:bg-purple-600" />
                          <Button size="sm" variant="outline" className="h-8 border-gray-700 bg-gray-800/50" onClick={() => sbManualExecute(a.id, true)}>
                            Run
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 border-gray-700 bg-gray-800/50" onClick={() => sbRemove(a.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gradient-to-br from-gray-900/90 to-gray-950/90 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-300">
                  Active Automations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {automations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">
                      You have no configured automations.
                    </p>
                    <Button
                      variant="link"
                      className="text-purple-400 mt-2"
                      onClick={() => setShowNewForm(true)}
                    >
                      Create your first automation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {automations.map((automation) => (
                      <div key={automation.id} className="relative">
                        <Card
                          className={`border border-gray-800 hover:border-gray-700 bg-gray-900/30 hover:bg-gray-900/50 transition-all duration-200 overflow-hidden ${
                            automation.active
                              ? "animate-pulse-subtle"
                              : "opacity-75"
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`mt-1 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center ${
                                    automation.active
                                      ? "animate-pulse-subtle"
                                      : ""
                                  }`}
                                >
                                  {getAutomationIcon(automation.type)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium">
                                      {automation.name}
                                    </h3>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        automation.type === "payment"
                                          ? "bg-blue-900/30 text-blue-400 border-blue-800"
                                          : automation.type === "swap"
                                          ? "bg-purple-900/30 text-purple-400 border-purple-800"
                                          : "bg-yellow-900/30 text-yellow-400 border-yellow-800"
                                      }`}
                                    >
                                      {automation.type === "payment"
                                        ? "Payment"
                                        : automation.type === "swap"
                                        ? "Swap"
                                        : "Rule"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-400 mt-1">
                                    {automation.description}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-gray-500">
                                      {getNextExecutionText(automation)}
                                    </span>
                                    {(automation.executionCount ?? 0) > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-gray-800/50 text-gray-400 border-gray-700"
                                      >
                                        {automation.executionCount} executions
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={automation.active}
                                  onCheckedChange={() =>
                                    toggleAutomation(automation.id!)
                                  }
                                  className="data-[state=checked]:bg-purple-600"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800/50"
                                  onClick={() =>
                                    setExpandedAutomation(
                                      expandedAutomation === automation.id
                                        ? null
                                        : automation.id ?? null
                                    )
                                  }
                                >
                                  {expandedAutomation === automation.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            <AnimatePresence>
                              {expandedAutomation === automation.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-4 pt-4 border-t border-gray-800"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                      <h4 className="text-sm font-medium text-gray-300">
                                        Details
                                      </h4>

                                      {automation.type === "payment" && (
                                        <>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-gray-400">
                                              Recipient
                                            </span>
                                            <span className="text-sm font-mono">
                                              {automation.recipient}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-gray-400">
                                              Amount
                                            </span>
                                            <span className="text-sm">
                                              {automation.amount}{" "}
                                              {automation.asset}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-gray-400">
                                              Frequency
                                            </span>
                                            <span className="text-sm">
                                              {automation.frequency === "once"
                                                ? "Once"
                                                : automation.frequency ===
                                                  "weekly"
                                                ? "Weekly"
                                                : automation.frequency === "monthly"
                                                ? "Monthly"
                                                : automation.frequency === "yearly"
                                                ? "Yearly"
                                                : "Unknown"}
                                            </span>
                                          </div>
                                          {automation.memo && (
                                            <div className="flex justify-between">
                                              <span className="text-sm text-gray-400">
                                                Memo
                                              </span>
                                              <span className="text-sm">
                                                {automation.memo}
                                              </span>
                                            </div>
                                          )}
                                        </>
                                      )}

                                      {automation.type === "swap" && (
                                        <>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-gray-400">
                                              Convert
                                            </span>
                                            <span className="text-sm">
                                              {automation.amountFrom}{" "}
                                              {automation.assetFrom} →{" "}
                                              {automation.assetTo}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-gray-400">
                                              Condition
                                            </span>
                                            <span className="text-sm">
                                              {automation.condition ===
                                              "price_increase"
                                                ? `When the price increases by ${automation.conditionValue}%`
                                                : automation.condition ===
                                                  "price_decrease"
                                                ? `When the price decreases by ${automation.conditionValue}%`
                                                : `When the price reaches ${automation.conditionValue} USDC`}
                                            </span>
                                          </div>
                                          {automation.lastExecution && (
                                            <div className="flex justify-between">
                                              <span className="text-sm text-gray-400">
                                                Last Execution
                                              </span>
                                              <span className="text-sm">
                                                {formatDate(
                                                  automation.lastExecution
                                                )}
                                              </span>
                                            </div>
                                          )}
                                        </>
                                      )}

                                      {automation.type === "rule" && (
                                        <>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-gray-400">
                                              Asset
                                            </span>
                                            <span className="text-sm">
                                              {automation.asset}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-gray-400">
                                              Threshold
                                            </span>
                                            <span className="text-sm">
                                              {typeof automation.threshold ===
                                                "number" &&
                                              automation.threshold < 0
                                                ? `${Math.abs(
                                                    Number(automation.threshold)
                                                  )}% drop`
                                                : `${automation.threshold} ${automation.asset}`}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-gray-400">
                                              Action
                                            </span>
                                            <span className="text-sm">
                                              {automation.action === "alert"
                                                ? "Send alert"
                                                : automation.action === "buy"
                                                ? `Buy ${automation.amount} ${automation.asset}`
                                                : automation.action === "sell"
                                                ? `Sell ${automation.amount} ${automation.asset}`
                                                : "Custom action"}
                                            </span>
                                          </div>
                                        </>
                                      )}

                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">
                                          Created
                                        </span>
                                        <span className="text-sm">
                                          {formatDate(automation.createdAt!)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <h4 className="text-sm font-medium text-gray-300">
                                        Financial Impact
                                      </h4>
                                      <div className="h-32 bg-gray-800/30 rounded-lg p-2">
                                        <FinancialImpactChart
                                          automation={automation}
                                        />
                                      </div>

                                      {automation.type === "payment" && (
                                        <div className="flex items-center gap-2 text-xs text-yellow-500/90 bg-yellow-500/5 rounded-md p-3">
                                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                          <p>
                                            This automation will use
                                            approximately{" "}
                                            {Number(automation.amount) * 12}{" "}
                                            {automation.asset} per year.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-9 border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
                                      onClick={() =>
                                        deleteAutomation(automation.id!)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-9 bg-gradient-to-r from-[#3B82F6] to-[#9333EA] hover:from-[#4F46E5] hover:to-[#7C3AED]"
                                      onClick={() => startEditing(automation)}
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Recent Executions from Supabase */}
            <Card className="border-gray-800 bg-gradient-to-br from-gray-900/90 to-gray-950/90 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-300">
                  Recent Executions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {sbExecutions.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-2">No executions yet</div>
                ) : (
                  <div className="space-y-2">
                    {sbExecutions.slice(0, 8).map((e) => (
                      <div key={e.id} className="flex items-center justify-between p-2 rounded-md bg-gray-900/40 border border-gray-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center">
                            {e.status === 'executed' ? (
                              <Zap className="h-3.5 w-3.5 text-green-400" />
                            ) : e.status === 'error' ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-blue-400" />
                            )}
                          </div>
                          <div className="truncate">
                            <div className="text-xs text-gray-300 truncate">
                              {e.status.toUpperCase()} · {new Date(e.executed_at).toLocaleString()}
                            </div>
                            {e.tx_hash && (
                              <div className="text-xs text-gray-500 truncate">{e.tx_hash}</div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs bg-gray-800/50 text-gray-400 border-gray-700">
                          {typeof e.metadata?.['type'] === 'string' ? (e.metadata?.['type'] as string) : 'payment'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gradient-to-br from-gray-900/90 to-gray-950/90 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-300">
                  Automation Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Active</div>
                      <div className="text-xl font-medium text-green-400">
                        {automations.filter((a) => a.active).length}
                      </div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Inactive</div>
                      <div className="text-xl font-medium text-gray-400">
                        {automations.filter((a) => !a.active).length}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Recurring Payments</span>
                      <span className="font-medium">
                        {automations.filter((a) => a.type === "payment").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Automatic Swaps</span>
                      <span className="font-medium">
                        {automations.filter((a) => a.type === "swap").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Smart Rules</span>
                      <span className="font-medium">
                        {automations.filter((a) => a.type === "rule").length}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-800">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      Upcoming Executions
                    </h4>
                    <div className="space-y-2">
                      {automations
                        .filter(
                          (a) =>
                            a.active && a.type === "payment" && a.nextExecution
                        )
                        .sort(
                          (a, b) =>
                            new Date(a.nextExecution!).getTime() -
                            new Date(b.nextExecution!).getTime()
                        )
                        .slice(0, 3)
                        .map((automation) => (
                          <div
                            key={`next-${automation.id}`}
                            className="flex justify-between items-center p-2 rounded-md bg-gray-800/30"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-400" />
                              <span className="text-sm truncate max-w-[150px]">
                                {automation.name}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(
                                automation.nextExecution!
                              ).toLocaleDateString("en-US", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                          </div>
                        ))}

                      {automations.filter(
                        (a) =>
                          a.active && a.type === "payment" && a.nextExecution
                      ).length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-2">
                          No scheduled executions
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gradient-to-br from-gray-900/90 to-gray-950/90 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-300">
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-900/30">
                    <div className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-purple-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-white">
                          Optimize Your Savings
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          Based on your expenses, you could save 25 XLM weekly
                          without affecting your liquidity.
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-8 px-0 text-purple-400 hover:text-purple-300"
                        >
                          Create Automation
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-900/30">
                    <div className="flex items-start gap-2">
                      <RefreshCw className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-white">
                          Take Advantage of Volatility
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          Set up an automatic swap to buy XLM when it drops by
                          8% and sell when it rises by 10%.
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-8 px-0 text-blue-400 hover:text-blue-300"
                        >
                          Create Automation
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
