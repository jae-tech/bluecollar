"use client"

import { useState } from "react"
import { X, CheckCircle2 } from "lucide-react"

const WORK_TYPES = [
  "\uBAA9\uACF5",
  "\uD0C0\uC77C",
  "\uC804\uAE30",
  "\uB3C4\uBC30",
  "\uC124\uBE44",
  "\uBBF8\uC7A5",
  "\uD398\uC778\uD2B8",
  "\uAE30\uD0C0",
]

const BUDGET_RANGES = [
  "100\uB9CC ~ 500\uB9CC \uC6D0",
  "500\uB9CC ~ 1,000\uB9CC \uC6D0",
  "1,000\uB9CC ~ 3,000\uB9CC \uC6D0",
  "3,000\uB9CC \uC774\uC0C1",
]

interface InquiryFormProps {
  workerName?: string
  projectTitle?: string
  onClose: () => void
}

export function InquiryForm({ workerName, projectTitle, onClose }: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    workType: "",
    budget: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate submission
    setTimeout(() => {
      setSubmitted(true)
      // Auto-close after 2.5 seconds
      setTimeout(onClose, 2500)
    }, 300)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        style={{ animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="\uB2EB\uAE30"
        >
          <X size={14} className="text-foreground" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{"\uD504\uB85C\uC81D\uD2B8 \uBB38\uC758\uD558\uAE30"}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {workerName && <span>{workerName}{"\uC73C\uB85C\uBD80\uD130 "}</span>}
            {"\uC5EC\uB978 \uBC29\uBB38\uC744 \uAE30\uB300\uD558\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4."}
          </p>
        </div>

        {/* Success State */}
        {submitted ? (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-4 min-h-96">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <CheckCircle2 size={32} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{"\uBB38\uC758\uAC00 \uC811\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4!"}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {"\uC911\uC18C \uB0B4 \uBE44\uC9C0\uC2A4 \uC624\uB294 \uC81C\uB3D9 \uC2F1\uC774 \uC5F0\uB77d\uC744 \uB4DC\uB9B4 \uC98C\uC815\uC785\uB2C8\uB2E4."}
              </p>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-foreground mb-2">
                {"\uC131\uB978 \uC774\uB984"} <span className="text-primary">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={"\uC608: \uC774\uBF85\uACE0\uC6A9"}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-foreground mb-2">
                {"\uc5f0\ub77d\ucc98 \uc804\ud654\ubc88\ud638"} <span className="text-primary">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder={"\uc608: 010-1234-5678"}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-xs font-semibold text-foreground mb-2">
                {"\uc2dc\uacf5 \uc704\uce58 (\ub3c4\uc2dc)"} <span className="text-primary">*</span>
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder={"\uc608: \uc11c\uc6b8 \uac15\ub0a8\uad6c"}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            {/* Work Type */}
            <div>
              <label htmlFor="workType" className="block text-xs font-semibold text-foreground mb-2">
                {"\uac84\ub978 \uc2dc\uacf5 \uc885\ub958"} <span className="text-primary">*</span>
              </label>
              <select
                id="workType"
                name="workType"
                value={formData.workType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors appearance-none"
              >
                <option value="">{"\uc120\ud0dd\ud574\uc8fc\uc138\uc694"}</option>
                {WORK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-xs font-semibold text-foreground mb-2">
                {"\uc608\uc0c1 \uc608\uc0b0"} <span className="text-primary">*</span>
              </label>
              <select
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors appearance-none"
              >
                <option value="">{"\uc608\uc0b0 \ubc94\uc704\ub97c \uc120\ud0dd\ud574\uc8fc\uc138\uc694"}</option>
                {BUDGET_RANGES.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-xs font-semibold text-foreground mb-2">
                {"\ucd94\uac00 \uba54\uba54\ubaa8"}
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                placeholder={"\uad6c\uccb4\uc801\uc778 \uc2dc\uacf5 \ub0b4\uc6a9\uc744 \ub9d0\uc528 \uc8fc\uc138\uc694."}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors mt-6"
            >
              {"\uc758\ub00b \uc2e0\uccad\ud558\uae30"}
            </button>

            <p className="text-xs text-muted-foreground text-center pt-2">
              {"\uadc0\uc911\ud55c \uc815\ubcf4 \ubcf4\ud638\ub97c \uc9c4\uc2e4 \ub12c\uade0 \ub2f9\uebf8\ub2e4."}
            </p>
          </form>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  )
}
