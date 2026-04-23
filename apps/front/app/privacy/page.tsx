import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보 처리방침 - Bluecollar CV",
  description: "Bluecollar CV 개인정보 처리방침",
};

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-foreground">
            개인정보 처리방침
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            시행일: 2026년 4월 24일
          </p>
        </div>

        {/* 본문 */}
        <div className="prose prose-sm max-w-none text-foreground space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. 개인정보의 처리 목적
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Bluecollar CV(이하 &ldquo;회사&rdquo;)는 다음의 목적을 위하여
              개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의
              용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보
              보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할
              예정입니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed mt-2">
              <li>
                <strong>회원 가입 및 관리:</strong> 회원제 서비스 제공에 따른
                본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지
              </li>
              <li>
                <strong>서비스 제공:</strong> 포트폴리오 프로필 생성, 콘텐츠
                제공, 본인 인증
              </li>
              <li>
                <strong>고충 처리:</strong> 민원인의 신원 확인, 민원사항 확인,
                처리결과 통보
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. 처리하는 개인정보 항목
            </h2>
            <p className="text-muted-foreground leading-relaxed font-medium">
              필수항목:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed mt-1">
              <li>이메일 주소, 비밀번호(암호화 저장), 이름</li>
              <li>휴대폰 번호 (본인 인증 시)</li>
              <li>서비스 이용 기록, 접속 로그, 쿠키</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed font-medium mt-3">
              선택항목:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed mt-1">
              <li>프로필 사진, 포트폴리오 사진</li>
              <li>사업장 정보, 소개 문구</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. 개인정보의 처리 및 보유 기간
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터
              개인정보를 수집 시에 동의받은 개인정보 보유·이용 기간 내에서
              개인정보를 처리·보유합니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed mt-2">
              <li>
                <strong>회원 탈퇴 시:</strong> 즉시 삭제 (단, 관련 법령에 따라
                보존 의무가 있는 경우 해당 기간 동안 보관)
              </li>
              <li>
                <strong>전자상거래 기록:</strong> 5년 (전자상거래 등에서의
                소비자보호에 관한 법률)
              </li>
              <li>
                <strong>접속 로그:</strong> 3개월 (통신비밀보호법)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. 개인정보의 제3자 제공
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서
              명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정
              등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를
              제3자에게 제공합니다.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              현재 회사는 수집한 개인정보를 외부에 제공하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. 개인정보 처리의 위탁
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 외부에
              위탁하고 있습니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed mt-2">
              <li>
                <strong>Amazon Web Services (AWS):</strong> 서버 인프라 운영,
                파일 스토리지(S3)
              </li>
              <li>
                <strong>Oracle Cloud:</strong> 백엔드 서버 운영
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. 정보주체와 법정대리인의 권리·의무 및 행사 방법
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련
              권리를 행사할 수 있습니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed mt-2">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. 쿠키의 설치·운영 및 거부
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 이용 정보를
              저장하고 수시로 불러오는 쿠키(cookie)를 사용합니다. 쿠키는
              웹사이트를 운영하는데 이용되는 서버가 이용자의 컴퓨터 브라우저에게
              보내는 소량의 정보이며 이용자들의 PC 컴퓨터 내의 하드디스크에
              저장됩니다. 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. 개인정보 보호책임자
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
              처리와 관련한 정보주체의 불만 처리 및 피해 구제 등을 위하여 아래와
              같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              서비스 내 문의하기를 통해 연락하실 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. 개인정보 처리방침 변경
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른
              변경 내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일
              전부터 공지사항을 통해 고지할 것입니다.
            </p>
          </section>

          <div className="border-t border-border pt-6 mt-10">
            <p className="text-xs text-muted-foreground">
              본 개인정보 처리방침은 2026년 4월 24일부터 시행됩니다.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              이용약관 보기:{" "}
              <Link href="/terms" className="text-primary hover:underline">
                이용약관
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
