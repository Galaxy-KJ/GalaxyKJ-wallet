'use client';

import React from 'react';
import { OfflineTestPanel } from '../../components/offline-test-panel';
import { OfflineIndicator } from '../../components/ui/offline-indicator';

export default function TestOfflinePage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            🧪 Offline Functionality Testing
          </h1>
          <p className="text-muted-foreground">
            Test and verify the offline support implementation
          </p>
        </div>

        {/* Offline Status Banner */}
        <OfflineIndicator variant="banner" />

        {/* Test Panel */}
        <OfflineTestPanel />

        {/* Quick Test Instructions */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            🚀 Quick Test Guide
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-foreground mb-2">1. Automated Tests</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Click &quot;Run All Tests&quot; above</li>
                <li>• Check console for detailed results</li>
                <li>• Verify Service Worker registration</li>
                <li>• Test IndexedDB functionality</li>
                <li>• Check transaction queue</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-foreground mb-2">2. Manual Tests</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Open DevTools (F12)</li>
                <li>• Go to Network tab</li>
                <li>• Check &quot;Offline&quot; checkbox</li>
                <li>• Refresh page</li>
                <li>• Look for offline indicators</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Expected Results */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            ✅ Expected Results
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-foreground mb-2">Online Mode</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Green connection indicator</li>
                <li>• All features working normally</li>
                <li>• Service Worker active</li>
                <li>• Cache populated</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-foreground mb-2">Offline Mode</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Red offline banner</li>
                <li>• Cached content still accessible</li>
                <li>• Transactions queued</li>
                <li>• Graceful error handling</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Browser Console Test */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            🔧 Browser Console Test
          </h2>
          
          <div className="bg-background border border-border rounded p-4">
            <p className="text-sm text-muted-foreground mb-2">
              Open browser console and run:
            </p>
            <code className="text-green-400 text-sm block bg-gray-950 p-2 rounded">
              testOfflineFunctionality()
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
