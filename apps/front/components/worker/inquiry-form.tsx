"use client"

import { useState } from "react"
import { X, CheckCircle, ChevronDown } from "lucide-react"

interface InquiryFormProps {
  open: boolean
  onClose: () => void
  workerName: string
  projectTitle?: string
}

const WORK_TYPES = [
  "\uBAA9\uACF5 / \uBE4C\uD2B8\uC778",
  "\uD0C0\uC77C \uC2DC\uACF5",
  "\uC804\uAE30 \uACF5\uC0AC",
  "\uB3C4\uBC30 / \uBC7D\uC9C0",
  "\uC124\uBE44 \uACF5\uC0AC",
  "\uBBF8\uC7A5 / \uD398\uC778\uD2B8",
  "\uC778\uD14C\uB9AC\uC5B4 \uC804\uCCB4",
  "\uAE30\uD0C0",
]

const BUDGET_RANGES = [
  "100\uB9CC\uC6D0 \uC774\uD558",
  "100 ~ 300\uB9CC\uC6D0",
  "300 ~ 500\uB9CC\uC6D0",
  "500\uB9CC ~ 1\uCC9C\uB9CC\uC6D0",
  "1\uCC9C\uB9CC ~ 3\uCC9C\uB9CC\uC6D0",
  "3\uCC9C\uB9CC\uC6D0 \uC774\uC0C1",
  "\uCEA8\uCEE8\uC744 \uBC1B\uACE0 \uC2F6\uC74C",
]

export function InquiryForm({ open, onClose, workerName, projectTitle }: InquiryFormProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    location: "",
    workType: "",
    budget: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const validate = () => {
    const next: Partial<typeof form> = {}
    if (!form.name.trim()) next.name = "\uC774\uB984\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694."
    if (!form.phone.trim()) next.phone = "\uC5F0\uB77D\uCC98\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694."
    if (!form.location.trim()) next.location = "\uC2DC\uACF5 \uC704\uCE58\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694."
    if (!form.workType) next.workType = "\uACF5\uC885\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitted(true)
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setSubmitted(false)
      setForm({ name: "", phone: "", location: "", workType: "", budget: "", message: "" })
      setErrors({})
    }, 300)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="\uC758\uB80C \uC591\uC2DD"
      style={{ animation: "fadeIn 0.15s ease" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full md:max-w-lg bg-card rounded-t-2xl md:rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[96dvh] flex flex-col"
        style={{ animation: "slideUp 0.22s cubic-bezier(0.32,0.72,0,1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {submitted ? "\uC758\uB80C\uC774 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4" : "\uC2DC\uACF5 \uC758\uB80C\uD558\uAE30"}
            </h2>
            {!submitted && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {projectTitle
                  ? `"${projectTitle}" \uAE30\uBC18 \uC758\uB80C`
                  : `${workerName} \uC5D0\uAC8C \uBB3C\uC5B4\uBCF4\uC138\uC694`}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors flex-shrink-0"
            aria-label="\uB2EB\uAE30"
          >
            <X size={14} className="text-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {submitted ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center justify-center text-center px-8 py-14 gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <CheckCircle size={30} className="text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground mb-2">
                  {workerName}{"\uB2D8\uAED8 \uC758\uB80C\uC774 \uC804\uB2EC\uB418\uC5C8\uC2B5\uB2C8\uB2E4"}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                  {"\uC5F0\uB77D\uCC98\uB85C \uBE60\uB978 \uC2DC\uAC04 \uC548\uC5D0 \uC548\uB0B4\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4.\n\uC870\uAE08\uB9CC \uAE30\uB2E4\uB824 \uC8FC\uC138\uC694."}
                </p>
              </div>
              <div className="w-full h-px bg-border" />
              <div className="w-full flex flex-col gap-2 text-sm text-left bg-secondary rounded-xl border border-border p-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{"\uC2DC\uACF5 \uC704\uCE58"}</span>
                  <span className="font-medium text-foreground">{form.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{"\uACF5\uC885"}</span>
                  <span className="font-medium text-foreground">{form.workType}</span>
                </div>
                {form.budget && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{"\uC608\uC0B0"}</span>
                    <span className="font-medium text-foreground">{form.budget}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
              >
                {"\uD655\uC778"}
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} noValidate className="px-6 py-6 flex flex-col gap-5">

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {"\uC774\uB984"} <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="\uD64D\uAE38\uB3D9"
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${errors.name ? "border-red-400" : "border-border focus:border-primary"}`}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {"\uC5F0\uB77D\uCC98 (\uD734\uB300\uD3F0)"} <span className="text-primary">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="010-0000-0000"
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${errors.phone ? "border-red-400" : "border-border focus:border-primary"}`}
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {"\uC2DC\uACF5 \uC704\uCE58"} <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={set("location")}
                  placeholder="\uC11C\uC6B8\uC2DC \uAC15\uB0A8\uAD6C \uC544\uD30C\uD2B8 \uB3C4\uBA85\uC218 \uAE38 123"
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${errors.location ? "border-red-400" : "border-border focus:border-primary"}`}
                />
                {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
              </div>

              {/* Work type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {"\uACF5\uC885"} <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.workType}
                    onChange={set("workType")}
                    className={`w-full appearance-none px-4 py-3.5 pr-10 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${form.workType ? "text-foreground" : "text-muted-foreground"} ${errors.workType ? "border-red-400" : "border-border focus:border-primary"}`}
                  >
                    <option value="" disabled>{"\uACF5\uC885\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694"}</option>
                    {WORK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                {errors.workType && <p className="text-xs text-red-500">{errors.workType}</p>}
              </div>

              {/* Budget */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">{"\uC608\uC0B0 \uBC94\uC704 (\uC120\uD0DD)"}</label>
                <div className="grid grid-cols-2 gap-2">
                  {BUDGET_RANGES.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, budget: prev.budget === b ? "" : b }))}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left ${form.budget === b ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground hover:border-primary/40"}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">{"\uCD94\uAC00 \uBB38\uC758 \uB0B4\uC6A9 (\uC120\uD0DD)"}</label>
                <textarea
                  value={form.message}
                  onChange={set("message")}
                  rows={3}
                  placeholder="\uC6D0\uD558\uC2DC\uB294 \uB514\uC790\uC778, \uCC38\uACE0 \uC0AC\uC9C4, \uC2DC\uACF5 \uC2DC\uC791 \uD76C\uB9DD \uC77C\uC815 \uB4F1\uC744 \uC790\uC720\uB86D\uAC8C \uC801\uC5B4\uC8FC\uC138\uC694."
                  className="w-full px-4 py-3.5 rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all mt-1"
              >
                {"\uC758\uB80C \uC694\uCCAD\uD558\uAE30"}
              </button>

              <p className="text-xs text-muted-foreground text-center -mt-2">
                {"\uC81C\uCD9C\uD558\uC2E4 \uACBD\uC6B0 \uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC\uBC29\uCE68\uC5D0 \uB3D9\uC758\uD558\uB294 \uAC83\uC73C\uB85C \uAC04\uC8FC\uD569\uB2C8\uB2E4."}
              </p>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  )
}
