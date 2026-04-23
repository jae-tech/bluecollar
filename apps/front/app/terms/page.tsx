import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관 - Bluecollar CV",
  description: "Bluecollar CV 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* 헤더 */}
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 inline-block"
          >
            ← 홈으로
          </Link>
          <h1 className="text-3xl font-bold text-foreground">이용약관</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            시행일: 2026년 4월 24일
          </p>
        </div>

        {/* 본문 */}
        <div className="prose prose-sm max-w-none text-foreground space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              제1조 (목적)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              이 약관은 Bluecollar CV(이하 &ldquo;회사&rdquo;)가 제공하는 현장
              전문가 디지털 프로필 서비스(이하 &ldquo;서비스&rdquo;)의 이용과
              관련하여 회사와 이용자 간의 권리, 의무 및 책임 사항을 규정함을
              목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              제2조 (정의)
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed">
              <li>
                &ldquo;서비스&rdquo;란 회사가 제공하는 현장 전문가 포트폴리오
                플랫폼 및 관련 제반 서비스를 말합니다.
              </li>
              <li>
                &ldquo;이용자&rdquo;란 이 약관에 따라 회사가 제공하는 서비스를
                받는 회원 및 비회원을 말합니다.
              </li>
              <li>
                &ldquo;회원&rdquo;이란 회사와 서비스 이용계약을 체결하고 회원
                아이디를 부여받은 자를 말합니다.
              </li>
              <li>
                &ldquo;워커&rdquo;란 본 플랫폼에서 자신의 시공 포트폴리오를
                등록하고 프로필을 운영하는 현장 전문가를 말합니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              제3조 (약관의 효력 및 변경)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게
              공지함으로써 효력이 발생합니다. 회사는 관련 법령을 위배하지 않는
              범위 내에서 본 약관을 개정할 수 있으며, 개정 시에는 적용일자 및
              개정 사유를 명시하여 서비스 내 공지사항을 통해 사전에 공지합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              제4조 (서비스의 제공 및 변경)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 다음과 같은 서비스를 제공합니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed mt-2">
              <li>현장 전문가 디지털 프로필 생성 및 관리</li>
              <li>포트폴리오 사진 업로드 및 시공 실적 관리</li>
              <li>개인 URL(slug.bluecollar.cv) 제공</li>
              <li>클라이언트와의 연결 서비스</li>
              <li>
                기타 회사가 추가 개발하거나 제휴 계약을 통해 제공하는 서비스
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              제5조 (회원가입)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본
              약관과 개인정보 처리방침에 동의한다는 의사표시를 함으로써 회원
              가입을 신청합니다. 회사는 제1항과 같이 회원으로 가입할 것을 신청한
              이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              제6조 (개인정보 보호)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 이용자의 개인정보를 보호하기 위하여 개인정보 처리방침을
              수립하고 준수합니다. 개인정보 처리방침에 관한 자세한 내용은{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                개인정보 처리방침
              </Link>
              을 확인해 주세요.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              제7조 (이용자의 의무)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              이용자는 다음 행위를 해서는 안 됩니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed mt-2">
              <li>신청 또는 변경 시 허위 내용 등록</li>
              <li>타인의 정보 도용</li>
              <li>회사가 게시한 정보의 변경</li>
              <li>
                회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는
                게시
              </li>
              <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
              <li>
                회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              제8조 (면책 조항)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를
              제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
              회사는 이용자의 귀책 사유로 인한 서비스 이용 장애에 대하여 책임을
              지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              제9조 (분쟁 해결)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              서비스 이용으로 발생한 분쟁에 대해 소송이 제기될 경우 회사의 본사
              소재지를 관할하는 법원을 관할 법원으로 합니다.
            </p>
          </section>

          <div className="border-t border-border pt-6 mt-10">
            <p className="text-xs text-muted-foreground">
              본 약관은 2026년 4월 24일부터 시행됩니다. 이전 약관은 새 약관으로
              대체됩니다.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              문의: 서비스 내 문의하기 또는 이메일로 연락해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
