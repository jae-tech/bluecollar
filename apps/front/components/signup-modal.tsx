"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { X, CheckCircle2 } from "lucide-react"

interface SignupModalProps {
  open: boolean
  onClose: () => void
}

export function SignupModal({ open, onClose }: SignupModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  // Close on ESC
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handler)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    onClose()
    router.push("/onboarding")
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(26,26,27,0.55)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="회원가입"
    >
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="닫기"
        >
          <X size={18} />
        </button>

        <div className="px-8 py-8">
          {!submitted ? (
            <>
              {/* Header */}
              <div className="flex flex-col gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">워커와 직접 소통하고 싶으신가요?</h2>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    회원가입 후 상세 견적을 확인하고 현장 전문가와 바로 연결하세요.
                  </p>
                </div>
              </div>

              {/* Perks */}
              <ul className="flex flex-col gap-3 mb-8">
                {[
                  "검증된 워커의 상세 포트폴리오 열람",
                  "직접 메시지 & 견적 요청",
                  "시공 완료 후 리뷰 작성",
                  "프로젝트 히스토리 관리",
                ].map((perk) => (
                  <li key={perk} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{perk}</span>
                  </li>
                ))}
              </ul>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label htmlFor="modal-email" className="sr-only">이메일</label>
                  <input
                    id="modal-email"
                    type="email"
                    placeholder="이메일 주소를 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground text-sm font-bold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all"
                >
                  무료로 회원가입하기
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  이미 계정이 있으신가요?{" "}
                  <button type="button" onClick={onClose} className="text-primary font-semibold hover:underline">
                    로그인
                  </button>
                </p>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="flex flex-col items-center text-center gap-6 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">가입 링크를 발송했어요!</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  <strong className="text-foreground">{email}</strong>으로 가입 링크를 보내드렸습니다.
                  메일을 확인해 주세요.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-primary text-primary-foreground text-sm font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors"
              >
                확인
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
