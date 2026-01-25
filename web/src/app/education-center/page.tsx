"use client";

import { useState } from "react";
import { Book, BookOpen, CircleHelp, NotepadText, Shield } from "lucide-react";
import { StarBackground } from "@/components/effects/star-background";
import { CategoryTabs } from "@/components/shared/category-tabs";
import { BlockchainGuides } from "@/components/education-center/blockchain-guides";
import { WalletTutorials } from "@/components/education-center/wallet-tutorials";
import { AdvancedFAQ } from "@/components/education-center/advanced-faq";
import { SecurityResources } from "@/components/education-center/security-resources";
import { CryptoGlossary } from "@/components/education-center/crypto-glossary";

export default function EducationCenterPage() {
  const [activeTab, setActiveTab] = useState("blockchain guides");

  const tabs = [
    { icon: <Book size={20} />, label: "blockchain guides" },
    { icon: <NotepadText size={20} />, label: "wallet tutorials" },
    { icon: <BookOpen size={20} />, label: "crypto glossary" },
    { icon: <CircleHelp size={20} />, label: "advanced faq" },
    { icon: <Shield size={20} />, label: "security resources" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "blockchain guides":
        return <BlockchainGuides />;
      case "wallet tutorials":
        return <WalletTutorials />;
      case "crypto glossary":
        return <CryptoGlossary />;
      case "advanced faq":
        return <AdvancedFAQ />;
      case "security resources":
        return <SecurityResources />;
      default:
        return <BlockchainGuides />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-background relative">
      <StarBackground />
      <div className="w-full min-h-screen relative z-10 flex flex-col items-start justify-start px-4 sm:px-6 py-8 gap-6">
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Knowledge Hub
          </h1>
          <input
            type="search"
            placeholder="Search resources"
            className="border border-input bg-background/50 px-5 py-2 rounded-lg text-foreground w-full sm:w-auto"
          />
        </div>

        <div className="w-full h-full flex flex-col gap-6 items-start">
          <CategoryTabs
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <div className="w-full">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
}
