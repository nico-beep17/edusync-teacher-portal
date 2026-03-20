"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Sparkles, ChevronDown, Lightbulb, BookOpen, HelpCircle } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const QUICK_ACTIONS = [
  { label: "How to enroll students?", icon: BookOpen },
  { label: "How to submit grades?", icon: Send },
  { label: "What is SF2?", icon: HelpCircle },
  { label: "Tips for faster grading", icon: Lightbulb },
]

// Built-in knowledge base for offline AI assistance
const KNOWLEDGE_BASE: Record<string, string> = {
  "enroll": `**Enrolling Students in DepAid:**\n\n1. Go to **Dashboard** → click **"Enroll Student (Form 138)"**\n2. Choose your method:\n   - **Manual** — type LRN, name, sex\n   - **AI Scan** — upload a photo of Form 138 for auto-extraction\n   - **CSV Bulk** — upload a CSV file in format: \`LRN, LASTNAME FIRSTNAME, M/F\`\n3. Click **Complete Enrollment** — student is added to your masterlist instantly.\n\n💡 *Tip: Use CSV Bulk upload at the start of the year to add all students at once!*`,

  "grade": `**Submitting Grades as a Subject Teacher:**\n\n1. Go to **My Workload** in the sidebar\n2. Click **"Open E-Class Record"** for your subject\n3. Enter scores for WW (Written Work), PT (Performance Task), and QA (Quarterly Assessment)\n4. The system **auto-computes** the quarterly grade using DepEd's transmutation table\n5. Click **"Transmit to Class Adviser"** — grades are sent to the Composite Aggregator\n\n💡 *Your class adviser will see a green checkmark once all students' grades are submitted!*`,

  "sf2": `**SF2 (School Form 2) — Daily Attendance:**\n\nSF2 is the official DepEd daily attendance record.\n\n1. Go to **SF2 Attendance** in the sidebar\n2. The grid shows the last 5 school days automatically\n3. Mark students as:\n   - **P** = Present (default)\n   - **A** = Absent (turns red)\n   - **L** = Late (turns amber)\n4. Click **"Mark All Present"** for quick batch entry\n5. Click **"Save Record"** to persist to local storage\n\n💡 *Use the QR Scanner for contactless attendance!*`,

  "tips": `**Pro Tips for Faster Grading:**\n\n🚀 **Batch Entry** — Enter all Written Work scores first, then Performance Tasks, then QA. It's faster than doing one student at a time.\n\n📋 **CSV Import** — If you have grades in Excel, export as CSV and use the bulk import feature.\n\n🔢 **Auto-Compute** — Don't manually calculate! DepAid uses the exact DepEd transmutation table automatically.\n\n☁️ **Cloud Sync** — Click "Sync PWA to Cloud" on the Dashboard to back up everything to Supabase.\n\n📱 **Offline Mode** — DepAid works offline! Enter grades even without internet.`,

  "composite": `**Composite Grades (Form 138):**\n\nThe Composite Grades page is for **Class Advisers** to collect and aggregate grades from all subject teachers.\n\n1. Go to **Composite Grades** in the sidebar\n2. The **Subject Teacher Submissions** widget shows which subjects have been transmitted\n3. Once a subject shows a green check, those grades auto-populate the grid\n4. Click **"Finalize General Average"** when all 8 subjects are complete\n5. Export using **"Export to Excel"** for official submission\n\n💡 *The general average and remarks (Passed/Failed) are calculated automatically!*`,

  "sf5": `**SF5 (School Form 5) — Promotion Report:**\n\nSF5 is the end-of-year promotion and retention report.\n\n1. Go to **SF5 Promotion** in the sidebar\n2. The system automatically calculates each student's status based on their general average:\n   - **75+** = PROMOTED\n   - **Below 75** = RETAINED\n   - **No grades** = PENDING\n3. The Summary Table shows male/female breakdown\n4. Click **"Download Excel"** for the official DepEd format\n\n💡 *SF5 updates in real-time as grades are submitted!*`,

  "default": `I'm your DepAid AI Assistant! I can help you with:\n\n📚 **Enrollment** — Adding students manually, via AI scan, or CSV bulk upload\n📝 **Grading** — E-Class Records, grade computation, and submission\n📋 **Attendance** — SF2 daily attendance, QR scanning\n📊 **Reports** — Composite grades, SF5 promotion reports\n🔧 **Settings** — Managing subjects, weights, and school info\n\nWhat would you like to know?`
}

function getAIResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase()
  
  if (msg.includes("enroll") || msg.includes("student") || msg.includes("add student") || msg.includes("form 138") || msg.includes("csv")) {
    return KNOWLEDGE_BASE["enroll"]
  }
  if (msg.includes("grade") || msg.includes("submit") || msg.includes("transmit") || msg.includes("ecr") || msg.includes("score")) {
    return KNOWLEDGE_BASE["grade"]
  }
  if (msg.includes("sf2") || msg.includes("attendance") || msg.includes("absent") || msg.includes("present") || msg.includes("qr")) {
    return KNOWLEDGE_BASE["sf2"]
  }
  if (msg.includes("tip") || msg.includes("fast") || msg.includes("quick") || msg.includes("help") || msg.includes("how")) {
    return KNOWLEDGE_BASE["tips"]
  }
  if (msg.includes("composite") || msg.includes("aggregate") || msg.includes("form 138") || msg.includes("adviser")) {
    return KNOWLEDGE_BASE["composite"]
  }
  if (msg.includes("sf5") || msg.includes("promot") || msg.includes("retain") || msg.includes("pass") || msg.includes("fail")) {
    return KNOWLEDGE_BASE["sf5"]
  }
  
  return KNOWLEDGE_BASE["default"]
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm your **DepAid AI Assistant**. I can help you navigate the portal, explain features, and give you tips for managing your class efficiently.\n\nWhat would you like to know?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const sendMessage = (text: string) => {
    if (!text.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    // Simulate AI thinking delay
    setTimeout(() => {
      const response = getAIResponse(text)
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
    }, 600 + Math.random() * 800)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Bold
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Inline code
      line = line.replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-emerald-700">$1</code>')
      // Emoji lines get extra spacing
      if (line.trim() === '') return <br key={i} />
      return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: line }} />
    })
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen 
            ? 'bg-slate-700 hover:bg-slate-800 rotate-0' 
            : 'bg-gradient-to-br from-[#1ca560] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
        }`}
      >
        {isOpen ? (
          <ChevronDown size={22} className="text-white" />
        ) : (
          <div className="relative">
            <MessageCircle size={22} className="text-white" />
            <Sparkles size={10} className="text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#1ca560] to-emerald-600 text-white shrink-0">
            <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm leading-tight">DepAid AI Assistant</h3>
              <p className="text-[10px] text-emerald-100 font-medium">Always here to help • Offline Ready</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-white/20 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[280px] max-h-[340px]">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#1ca560] text-white rounded-br-md' 
                    : 'bg-slate-100 text-slate-700 rounded-bl-md border border-slate-200/60'
                }`}>
                  {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-200/60">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(action.label)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#1ca560] transition-colors"
                >
                  <action.icon size={12} />
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#1ca560] focus:ring-1 focus:ring-[#1ca560] transition-colors"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#1ca560] text-white hover:bg-[#158045] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
