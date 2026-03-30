import { SearchX } from "lucide-react"
import Link from "next/link"

interface EmptyStateProps {
  tab: "projects" | "workers"
}

export function EmptyState({ tab }: EmptyStateProps) {
  const isProjects = tab === "projects"

  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <SearchX size={28} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2 text-center">
        {isProjects
          ? "\uCC3E\uB294 \uD504\uB85C\uC81D\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."
          : "\uCC3E\uB294 \uC6CC\uCEE4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}
      </h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        {isProjects
          ? "\ub2e4\ub978 \ubd84\uc57c\ub098 \uc608\uc0b0\uc73c\ub85c \uac80\uc0c9\ud574 \ubcf4\uc138\uc694."
          : "\ub2e4\ub978 \ubd84\uc57c\ub098 \uacbd\ub825\uc73c\ub85c \uac80\uc0c9\ud574 \ubcf4\uc138\uc694."}
      </p>
      <Link
        href="/search"
        className="px-5 py-2.5 rounded-lg border border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition-colors"
      >
        {"\ucd08\uae30\ud654"}
      </Link>
    </div>
  )
}
