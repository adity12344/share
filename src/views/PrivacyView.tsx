import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Mail,
  Trash2,
  FileText,
  KeyRound,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

interface PrivacySection {
  id: string;
  number: number;
  title: string;
  icon: React.ReactNode;
  summary: string;
  content: React.ReactNode;
}

export const PrivacyView: React.FC = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'sec_1': true,
    'sec_3': true,
    'sec_5': true,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    sections.forEach((s) => (allOpen[s.id] = true));
    setOpenSections(allOpen);
  };

  const collapseAll = () => {
    setOpenSections({});
  };

  const sections: PrivacySection[] = [
    {
      id: 'sec_1',
      number: 1,
      title: 'Information Collected',
      icon: <FileText className="w-5 h-5 text-amber-500" />,
      summary: 'We collect your SRMIST email, chosen display name, avatar, and listing data.',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
          <p>
            When registering or using SHARE, we collect the minimal information necessary for genuine campus peer-to-peer commerce:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-medium">
            <li><strong>Institutional Identity:</strong> Your official SRM student email (e.g. <code>@srmist.edu.in</code>) used to grant verified status.</li>
            <li><strong>Account Profile:</strong> Display name, optional department/college branch, and optional avatar image.</li>
            <li><strong>Marketplace Postings:</strong> Title, description, price, category, and uploaded photos of items you offer or request.</li>
            <li><strong>Exchange History:</strong> Completed deal count displayed on your trust badge to build reputation.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'sec_2',
      number: 2,
      title: 'Why We Collect It',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
      summary: 'Strictly to maintain a trusted, spam-free, student-only exchange environment.',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
          <p>
            Unlike open classifieds, SHARE is built exclusively for the SRM campus community:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-medium">
            <li>Prevent outside scammers, unauthorized commercial vendors, or non-students from posting fraudulent ads.</li>
            <li>Guarantee physical safety during hostel, library, and tech park handoffs.</li>
            <li>Facilitate instant AI semantic matching between students who have items and those who need them.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'sec_3',
      number: 3,
      title: 'Visible Campus Data',
      icon: <Eye className="w-5 h-5 text-sky-500" />,
      summary: 'What other students see: display name, verified badge, items, and reviews.',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
          <p>The following information is publicly visible to registered campus peers:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-700">
              <span className="font-bold text-stone-900 dark:text-stone-100 block mb-1">✅ Publicly Shown</span>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                <li>Display Name & Avatar</li>
                <li>Verified SRM Student Badge</li>
                <li>Active Listings & Wanted Items</li>
                <li>Completed Exchange Counter</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-700">
              <span className="font-bold text-stone-900 dark:text-stone-100 block mb-1">🔒 Hidden / Protected</span>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                <li>Password credentials (salted hashes)</li>
                <li>Hostel room number / Personal phone</li>
                <li>Private search query logs</li>
                <li>Unpublished draft postings</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'sec_4',
      number: 4,
      title: 'Private Data & Protection',
      icon: <EyeOff className="w-5 h-5 text-rose-500" />,
      summary: 'Zero monetization of personal records. No selling of student data to 3rd parties.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
          <p>
            We adhere strictly to privacy-first architecture. We do <strong>NOT</strong> sell student phone numbers, email lists, or browsing behaviors to advertisers, loan companies, or third-party lead brokers.
          </p>
          <p>
            All data stored in Firebase is governed by strict Firestore Security Rules that prohibit unauthorized read/write access.
          </p>
        </div>
      ),
    },
    {
      id: 'sec_5',
      number: 5,
      title: 'AI Data Processing & Privacy',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      summary: 'Gemini AI processes search queries and price evaluation ephemerally.',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
          <p>
            SHARE uses Google Gemini AI for smart capabilities including Semantic Search, AI Deal Checker, and AI Matchmaking:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-medium">
            <li><strong>Ephemeral Analysis:</strong> When you search for "cheap calculator under ₹500", Gemini only analyzes the text to extract budget and category keywords.</li>
            <li><strong>No Model Training:</strong> Your private account data or email conversations are not used to train foundational AI models.</li>
            <li><strong>Fair Market Valuation:</strong> AI Deal Check evaluates the item's condition and title against historical student benchmark rates to flag overpricing.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'sec_6',
      number: 6,
      title: 'Message & Contact Handling',
      icon: <Mail className="w-5 h-5 text-emerald-500" />,
      summary: 'Direct peer-to-peer mailto handoff without middleman chat harvesting.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
          <p>
            When you click "Contact Student Seller", SHARE opens your trusted email client directly with a pre-filled subject line. We do not store or read your private email exchanges or negotiated prices.
          </p>
        </div>
      ),
    },
    {
      id: 'sec_7',
      number: 7,
      title: 'Listing Ownership & Control',
      icon: <Lock className="w-5 h-5 text-amber-500" />,
      summary: 'You retain full ownership. Mark items as completed or delete them anytime.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
          <p>
            You have absolute control over your postings. Once an exchange is completed, click <strong>"Mark as COMPLETED"</strong> to instantly prevent further inquiries and preserve campus history.
          </p>
        </div>
      ),
    },
    {
      id: 'sec_8',
      number: 8,
      title: 'Account & Data Deletion',
      icon: <Trash2 className="w-5 h-5 text-rose-500" />,
      summary: 'Full Right to be Forgotten upon graduation or at your request.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
          <p>
            Graduating or moving off campus? You can request complete deletion of your profile, listings, and associated feedback by contacting the campus moderation team. All corresponding records will be permanently removed.
          </p>
        </div>
      ),
    },
    {
      id: 'sec_9',
      number: 9,
      title: 'Security & Infrastructure',
      icon: <KeyRound className="w-5 h-5 text-blue-500" />,
      summary: 'Modern TLS 1.3 encryption, Firebase Auth tokens, and verified access rules.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
          <p>
            All network communication is encrypted over HTTPS using modern TLS 1.3 protocols. Authentication tokens are securely verified on each transaction to prevent identity spoofing.
          </p>
        </div>
      ),
    },
    {
      id: 'sec_10',
      number: 10,
      title: 'Campus Moderation & Support',
      icon: <HelpCircle className="w-5 h-5 text-purple-500" />,
      summary: 'Student safety guidelines, prohibited items enforcement, and peer support.',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
          <p>
            Prohibited items include illegal substances, counterfeit lab chemicals, exam cheating devices, and stolen property.
          </p>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border-2 border-stone-900 dark:border-amber-700 text-stone-900 dark:text-stone-100 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block mb-0.5">Need immediate assistance or reporting an unsafe listing?</span>
              <span>Ask Campus Bot 24/7 or contact the student moderation desk at <code>safety@srm-share.edu</code>.</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="rounded-2xl border-2 border-stone-900 dark:border-stone-700 bg-[#faf6ee] dark:bg-[#1c1a18] p-6 sm:p-8 shadow-[4px_4px_0px_0px_#1e1c1a] dark:shadow-[4px_4px_0px_0px_#000000]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-400 text-stone-950 text-xs font-bold uppercase tracking-wider border-2 border-stone-900 shadow-retro-sm">
                <ShieldCheck className="w-4 h-4 text-stone-950" />
                <span>Privacy & Security Charter</span>
              </span>
              <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                CAMPUS PROTOCOL 2026
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-sans text-stone-950 dark:text-stone-100 tracking-tight">
              Your Privacy Matters
            </h1>
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
              We keep your campus exchange experience transparent, secure, and under your complete control.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="text-xs font-bold"
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="text-xs font-bold"
            >
              Collapse All
            </Button>
          </div>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen = !!openSections[section.id];
          return (
            <div
              key={section.id}
              className="rounded-xl border-2 border-stone-900 dark:border-stone-700 bg-white dark:bg-[#1c1a18] shadow-[3px_3px_0px_0px_#1e1c1a] dark:shadow-[3px_3px_0px_0px_#000000] overflow-hidden transition-all"
            >
              {/* Accordion Header Button */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-amber-50/50 dark:hover:bg-stone-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-700 flex items-center justify-center shrink-0">
                    {section.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                        0{section.number}.
                      </span>
                      <h3 className="font-bold text-base text-stone-950 dark:text-stone-100 truncate">
                        {section.title}
                      </h3>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                      {section.summary}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-7 h-7 rounded-lg border-2 border-stone-900 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 flex items-center justify-center transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 bg-amber-300 dark:bg-amber-500 text-stone-950' : 'text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Accordion Body */}
              {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t-2 border-dashed border-stone-200 dark:border-stone-800 animate-in fade-in-50 duration-200">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
