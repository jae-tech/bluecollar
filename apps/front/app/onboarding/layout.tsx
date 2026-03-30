import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "\uAC00\uC785\uD558\uAE30 - Bluecollar CV",
  description: "\uD604\uC7A5 \uC804\uBB38\uAC00\uB97C \uC704\uD55C \uB514\uC9C0\uD138 \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uD50C\uB7AB\uD3FC\uC5D0 \uAC00\uC785\uD558\uC138\uC694.",
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {children}
    </div>
  )
}
