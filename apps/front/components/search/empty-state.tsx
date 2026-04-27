import { SearchX } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  tab: "projects" | "workers";
}

export function EmptyState({ tab }: EmptyStateProps) {
  const isProjects = tab === "projects";

  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <SearchX size={28} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2 text-center">
        {isProjects ? "찾는 프로젝트가 없습니다." : "찾는 워커가 없습니다."}
      </h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        {isProjects
          ? "다른 분야나 예산으로 검색해 보세요."
          : "다른 분야나 경력으로 검색해 보세요."}
      </p>
      <Link
        href="/search"
        className="px-5 py-2.5 rounded-lg border border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition-colors"
      >
        초기화
      </Link>
    </div>
  );
}
