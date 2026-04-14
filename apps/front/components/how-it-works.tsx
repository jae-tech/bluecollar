export function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "가입",
      desc: "이메일 하나로 시작합니다. 결제 정보는 필요 없습니다.",
      tag: "무료",
    },
    {
      num: "02",
      title: "시공 사진 등록",
      desc: "현장에서 찍은 사진을 올리면 됩니다. Before/After로 정리하면 더 설득력 있게 보입니다.",
      tag: "사진 업로드",
    },
    {
      num: "03",
      title: "링크 공유",
      desc: "내 이름으로 된 주소가 생깁니다. 카카오톡으로 보내도, 인스타 바이오에 걸어도 됩니다.",
      tag: "slug.bluecollar.cv",
    },
  ];

  return (
    <section id="about" className="py-20 border-t border-border">
      <div className="max-w-2xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          3분이면 생깁니다
        </h2>
        <p className="text-sm text-muted-foreground mb-12">
          설치도 없고, 카드 정보도 없습니다.
        </p>

        <div className="flex flex-col">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`flex gap-7 py-7 ${i < steps.length - 1 ? "border-b border-border" : ""}`}
            >
              <span className="text-4xl font-bold text-border leading-none flex-shrink-0 w-14 text-right select-none">
                {step.num}
              </span>
              <div className="pt-1">
                <h3 className="text-base font-bold text-foreground mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
                <span className="inline-block mt-3 text-[11px] font-semibold bg-primary/10 text-primary px-2 py-1 rounded-sm">
                  {step.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
