"use client";

import React, { useState } from "react";
import { useOfflineTransactions } from "../hooks/use-offline";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { PendingTransactionsIndicator } from "./ui/offline-indicator";
import {
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  OfflineTransactionData,
  OfflineTransactionResult,
} from "../types/offline-transaction";

export function OfflineTransactionHandler() {
  const {
    isOnline,
    pendingTransactions,
    sendTransactionOffline,
    getPendingTransactions,
  } = useOfflineTransactions();
  const [transactionData, setTransactionData] =
    useState<OfflineTransactionData>({
      to: "",
      amount: "",
      asset: "XLM",
      memo: "",
    });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OfflineTransactionResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await sendTransactionOffline(transactionData);

      // Transform the response to match the expected format
      if (response.success) {
        setResult({
          success: true,
          message: "Transacción enviada exitosamente",
        });
        // Limpiar formulario si fue exitoso
        setTransactionData({
          to: "",
          amount: "",
          asset: "XLM",
          memo: "",
        });
      } else if (response.queued) {
        setResult({
          success: false,
          message: "Transacción agregada a la cola offline",
          queued: true,
          transactionId: response.transactionId,
        });
      } else {
        setResult({
          success: false,
          message: "Error al procesar la transacción",
        });
      }
    } catch {
      setResult({
        success: false,
        message: "Error al procesar la transacción",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPending = async () => {
    try {
      await getPendingTransactions();
    } catch (error) {
      console.error("Failed to refresh pending transactions:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado de conexión */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            <span className="font-medium">
              {isOnline ? "Conexión Online" : "Modo Offline"}
            </span>
          </div>
          <PendingTransactionsIndicator />
        </div>
      </Card>

      {/* Formulario de transacción */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Nueva Transacción</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="to">Destinatario</Label>
            <Input
              id="to"
              type="text"
              value={transactionData.to}
              onChange={(e) =>
                setTransactionData((prev) => ({ ...prev, to: e.target.value }))
              }
              placeholder="Dirección Stellar"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Cantidad</Label>
              <Input
                id="amount"
                type="number"
                step="0.0000001"
                value={transactionData.amount}
                onChange={(e) =>
                  setTransactionData((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                placeholder="0.0000000"
                required
              />
            </div>
            <div>
              <Label htmlFor="asset">Activo</Label>
              <Input
                id="asset"
                type="text"
                value={transactionData.asset}
                onChange={(e) =>
                  setTransactionData((prev) => ({
                    ...prev,
                    asset: e.target.value,
                  }))
                }
                placeholder="XLM"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="memo">Memo (opcional)</Label>
            <Input
              id="memo"
              type="text"
              value={transactionData.memo}
              onChange={(e) =>
                setTransactionData((prev) => ({
                  ...prev,
                  memo: e.target.value,
                }))
              }
              placeholder="Mensaje adicional"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {loading ? "Procesando..." : "Enviar Transacción"}
          </Button>
        </form>

        {/* Resultado */}
        {result && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              result.success
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-yellow-50 border border-yellow-200 text-yellow-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span className="font-medium">
                {result.success ? "Transacción Exitosa" : "Transacción en Cola"}
              </span>
            </div>
            <p className="text-sm mt-1">{result.message}</p>
            {result.queued && result.transactionId && (
              <p className="text-xs mt-1 opacity-75">
                ID: {result.transactionId}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Transacciones pendientes */}
      {pendingTransactions > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Transacciones Pendientes</h3>
            <Button variant="outline" size="sm" onClick={handleRefreshPending}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">
                {pendingTransactions} transacciones pendientes
              </span>
            </div>
            <p className="text-sm text-yellow-700">
              Las transacciones se procesarán automáticamente cuando vuelvas a
              estar conectado.
            </p>
          </div>
        </Card>
      )}

      {/* Información adicional */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">¿Cómo funciona?</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            • <strong>Online:</strong> Las transacciones se envían
            inmediatamente
          </p>
          <p>
            • <strong>Offline:</strong> Las transacciones se guardan localmente
          </p>
          <p>
            • <strong>Sincronización:</strong> Se procesan automáticamente al
            reconectar
          </p>
          <p>
            • <strong>Seguridad:</strong> Los datos se almacenan de forma segura
            en tu dispositivo
          </p>
        </div>
      </Card>
    </div>
  );
}
