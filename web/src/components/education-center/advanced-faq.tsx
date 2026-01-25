import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// FAQ Data - This could be moved to a separate data file
const faqData = [
  {
    question: "What happens if I lose my recovery phrase?",
    answer:
      "If you lose your recovery phrase, you may permanently lose access to your funds. Recovery phrases are the master key to your wallet and cannot be recovered by Galaxy Wallet. Always store your recovery phrase in a secure, offline location such as a paper backup in a safe or a metal backup device. Never share your recovery phrase with anyone.",
    categories: ["Security", "Wallets"],
  },
  {
    question: "How are transaction fees calculated?",
    answer:
      "Transaction fees are calculated based on the current network congestion and complexity of the transaction. Each blockchain network has its own fee structure. For example, Ethereum uses gas fees that fluctuate based on network demand, while Bitcoin fees are based on transaction size and confirmation priority. In Galaxy Wallet, you can often choose between different fee tiers (slow, average, fast) depending on how quickly you need your transaction confirmed.",
    categories: ["Transactions"],
  },
  {
    question: "Can I cancel a cryptocurrency transaction?",
    answer:
      "In most cases, cryptocurrency transactions cannot be canceled once they are submitted to the blockchain network. This is by design – blockchain transactions are immutable. However, if your transaction is still pending and hasn't been included in a block, you may be able to submit a replacement transaction with a higher fee (known as Replace-By-Fee or RBF) on networks that support this feature.",
    categories: ["Transactions"],
  },
  {
    question: "How do I protect my wallet from hackers?",
    answer:
      "To protect your wallet: 1) Use a strong, unique password, 2) Enable two-factor authentication, 3) Keep your recovery phrase offline and in a secure location, 4) Be cautious of phishing attempts, 5) Use hardware wallets for large holdings, 6) Keep your software updated, 7) Use secure and private internet connections, and 8) Regularly audit your wallet activity for suspicious transactions.",
    categories: ["Security", "Wallets"],
  },
  {
    question:
      "What's the difference between custodial and non-custodial wallets?",
    answer:
      "In custodial wallets, a third party (like an exchange) holds your private keys and has control over your funds. While convenient, you're trusting that entity with your assets. Non-custodial wallets (like Galaxy Wallet) give you complete control by storing private keys on your device. You alone are responsible for security, but you have full ownership and control without relying on third parties to access your funds.",
    categories: ["Wallets", "Technology"],
  },
  {
    question: "How do I report suspicious activity or potential scams?",
    answer:
      "If you encounter suspicious activity, immediately report it through Galaxy Wallet's support section. Include transaction IDs, wallet addresses involved, and detailed description of the incident. You can also report cryptocurrency scams to relevant authorities like the FBI's Internet Crime Complaint Center (IC3), the FTC, or your country's financial regulatory bodies. Remember that verified Galaxy Wallet staff will never ask for your private keys or recovery phrase.",
    categories: ["Security", "Privacy"],
  },
  {
    question:
      "What happens during a blockchain fork and how does it affect my assets?",
    answer:
      "A blockchain fork occurs when a blockchain splits into two separate chains. Soft forks are backward-compatible upgrades, while hard forks create two divergent blockchains. During a hard fork, you may receive duplicate assets on both chains if you held the original cryptocurrency before the fork. Galaxy Wallet will notify users about major forks and provide guidance on accessing forked assets, though support for all forks is not guaranteed.",
    categories: ["Technology", "Investments"],
  },
  {
    question:
      "How do I participate in staking or yield farming through Galaxy Wallet?",
    answer:
      "Galaxy Wallet supports staking for proof-of-stake networks and yield farming in DeFi protocols. To participate: 1) Navigate to the 'Earn' section, 2) Select your asset and preferred staking/farming option, 3) Review the terms, rewards, and lock-up periods, 4) Confirm your participation. Remember that staking typically involves locking your assets for a period, and yield farming may expose you to smart contract risks and impermanent loss.",
    categories: ["Investments", "Technology"],
  },
  {
    question: "Can I use Galaxy Wallet for business or institutional purposes?",
    answer:
      "Yes, Galaxy Wallet offers enhanced features for business and institutional users. These include multi-signature authorization, team access management, enhanced security protocols, and detailed transaction reporting for accounting purposes. Business accounts also provide API access for integration with your existing financial systems. Contact our business support team for assistance in setting up and configuring a business account.",
    categories: ["Business", "Wallets"],
  },
  {
    question: "How does Galaxy Wallet handle privacy and data protection?",
    answer:
      "Galaxy Wallet prioritizes your privacy with end-to-end encryption for all sensitive data. We use a zero-knowledge architecture where possible, meaning we don't have access to your private keys or recovery phrases. User data is stored according to strict security protocols, and we only collect information necessary for wallet functionality. You can review our complete privacy policy in the settings menu for detailed information on data collection, usage, and your privacy controls.",
    categories: ["Privacy", "Security"],
  },
];

// Filter categories based on the categories in the FAQ data
const filterCategories = [
  { label: "All", value: "All" },
  { label: "Security", value: "Security" },
  { label: "Transactions", value: "Transactions" },
  { label: "Wallets", value: "Wallets" },
  { label: "Technology", value: "Technology" },
  { label: "Investments", value: "Investments" },
  { label: "Business", value: "Business" },
  { label: "Privacy", value: "Privacy" },
];

// FAQ Item Component
const FAQItem = ({
  question,
  answer,
  categories,
  isOpen,
  toggleOpen,
}: {
  question: string;
  answer: string;
  categories: string[];
  isOpen: boolean;
  toggleOpen: () => void;
}) => {
  // Get the first category for display purposes
  const primaryCategory = categories[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border border-border rounded-lg overflow-hidden"
    >
      <button
        onClick={toggleOpen}
        className="w-full px-4 py-3 flex justify-between items-center bg-card text-left text-foreground"
      >
        <div className="">
          <span className="font-medium">{question}</span>
          <span className="border border-white/30 text-black rounded-full px-2 py-0.5 text-xs capitalize ml-2">
            {primaryCategory}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-muted border-t border-border"
          >
            <div className="p-4 text-gray-300 text-sm">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main AdvancedFAQ Component
export function AdvancedFAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  // Filter FAQ items based on search and category
  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || faq.categories.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  // Toggle FAQ item open/closed
  const toggleItem = (question: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [question]: !prev[question],
    }));
  };

  return (
    <div className="space-y-6">
      <section className="flex gap-4 max-md:flex-col md:items-start justify-between">
        {/* Search bar */}
        <label className="relative flex flex-1 min-w-sm md:max-w-md items-center">
          <Search className="absolute left-3 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search questions or answers..."
            className="pl-10 bg-card/50 border-border text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap">
          {filterCategories.map((category) => (
            <Button
              key={category.value}
              className={`border-border bg-card/50 hover:bg-card text-muted-foreground cursor-pointer
                ${selectedCategory === category.value && "bg-white text-black hover:bg-white/80"}`}
              onClick={() => setSelectedCategory(category.value)}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </section>

      {/* FAQ items */}
      <div className="space-y-3">
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              categories={faq.categories}
              isOpen={!!openItems[faq.question]}
              toggleOpen={() => toggleItem(faq.question)}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            No FAQs found matching your criteria. Try adjusting your search or
            filters.
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvancedFAQ;
