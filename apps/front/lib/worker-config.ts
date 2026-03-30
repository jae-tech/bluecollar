/**
 * WORKER_CONFIG — single source of truth for a worker's personal site.
 * Claude Code will later fetch this from the database keyed by subdomain slug.
 * e.g.  GET /api/worker?slug=kimchulsoo  →  returns WorkerConfig
 */

export interface PortfolioProject {
  id: string
  title: string
  location: string
  scale: string
  duration: string
  year: number
  coverImg: string
  images: string[]
  description: string
  tags: string[]
  materials?: string[]
}

export interface ExperienceItem {
  period: string
  company: string
  role: string
  description: string
}

export interface WorkerConfig {
  // Identity
  slug: string
  name: string
  brandName: string          // shown as logo on top-left
  headline: string           // e.g. "성수동 프리미엄 인테리어 목수"
  bio: string
  avatar: string
  coverImg: string

  // Contact
  phone: string
  kakao: string
  region: string

  // Skills
  specialties: string[]
  yearsOfExperience: number
  totalProjects: number
  rating: number
  reviews: number

  // Badges
  verified: boolean          // 자격증 인증
  cvVerified: boolean        // Bluecollar CV 인증

  // Portfolio
  portfolio: PortfolioProject[]

  // Experience Timeline
  experience: ExperienceItem[]

  // Theming (Claude Code can customise per worker)
  accentColor: string
}

export const WORKER_CONFIG: WorkerConfig = {
  slug: "kimchulsoo",
  name: "\uAE40\uCCA0\uC218",
  brandName: "KCS \uBAA9\uACF5",
  headline: "\uC131\uC218\uB3D9 \uD504\uB9AC\uBBF8\uC5C4 \uC778\uD14C\uB9AC\uC5B4 \uBAA9\uC218",
  bio: "15\uB144\uC758 \uD604\uC7A5 \uACBD\uD5D8\uC744 \uBC14\uD0D5\uC73C\uB85C, \uACE0\uAC1D\uC758 \uACF5\uAC04\uC744 \uAC00\uC7A5 \uC544\uB984\uB2F5\uAC8C \uB9C8\uBB34\uB9AC\uD569\uB2C8\uB2E4. \uAC15\uB0A8\u00B7\uC131\uC218\uB3D9 \uD504\uB9AC\uBBF8\uC5C4 \uC544\uD30C\uD2B8\uC640 \uC0C1\uC5C5 \uACF5\uAC04\uC744 \uC911\uC2EC\uC73C\uB85C, \uBB3C\uCC28\uC5C6\uB294 \uB9C8\uAC10\uACFC \uC815\uD655\uD55C \uC2DC\uACF5\uC73C\uB85C \uD6C4\uAE30\uB97C \uC73C\uD0B5\uB2C8\uB2E4.",
  avatar: "/images/chulsoo-avatar.jpg",
  coverImg: "/images/portfolio-hero.jpg",
  phone: "010-1234-5678",
  kakao: "kimchulsoo_carpenter",
  region: "\uC11C\uC6B8 \uC131\uC218\uB3D9 \u00B7 \uAC15\uB0A8\uAD6C \u00B7 \uC9C0\uBC29 \uCD9C\uC7A5 \uAC00\uB2A5",
  specialties: ["\uBAA9\uACF5", "\uBB3C\uB9C8\uB8E8", "\uBE4C\uD2B8\uC778", "\uC870\uBA85 \uC124\uCE58", "\uC778\uD14C\uB9AC\uC5B4"],
  yearsOfExperience: 15,
  totalProjects: 312,
  rating: 4.9,
  reviews: 138,
  verified: true,
  cvVerified: true,
  accentColor: "#FF6B00",

  portfolio: [
    {
      id: "p1",
      title: "\uC131\uC218\uB3D9 \uB8E8\uD504\uD0D1 \uC8FC\uAC70 \uC804\uCCB4 \uBAA9\uACF5",
      location: "\uC11C\uC6B8 \uC131\uB3D9\uAD6C",
      scale: "\uB300\uD615 (\uC8FC\uAC70 \uC804\uCCB4)",
      duration: "6\uC8FC",
      year: 2024,
      coverImg: "/images/portfolio-hero.jpg",
      images: ["/images/portfolio-hero.jpg", "/images/portfolio-1.jpg", "/images/portfolio-2.jpg"],
      description: "\uB8E8\uD504\uD0D1 \uC2E0\uCD95 \uC8FC\uAC70\uC758 \uAC70\uC2E4, \uC8FC\uBC29, \uC11C\uC7AC \uC804\uCCB4\uB97C \uCF13\uC…\uD2B8 \uC6D0\uBAA9 \uBE4C\uD2B8\uC778\uC73C\uB85C \uC2DC\uACF5\uD588\uC2B5\uB2C8\uB2E4. \uACC4\uB2E8\uC2E4 \uB380 \uBCBD\uBA74 \uC0C1\uBD80\uBD80\uD130 \uCC9C\uC7A5\uAE4C\uC9C0 \uC6D0\uC7C1\uD615 \uC6B0\uB4E0 \uD328\uB110\uB85C \uB9C8\uAC10\uD588\uC2B5\uB2C8\uB2E4.",
      tags: ["\uBAA9\uACF5", "\uBE4C\uD2B8\uC778", "\uC6D0\uBAA9"],
      materials: ["\uC544\uBA54\uB9AC\uCE74\uB178 \uD654\uC774\uD2B8 \uC624\uD06C \uBB34\uAD11", "\uB4C0\uCF54 \uC218\uB098 \uD569\uD310", "\uD55C\uC218\uB9BC \uC6B0\uB808\uD0C4 \uB3C4\uB8CC"],
    },
    {
      id: "p2",
      title: "\uAC15\uB0A8 \uC544\uD30C\uD2B8 \uC8FC\uBC29 \uCE90\uBE44\uB137 \uC804\uCCB4 \uAD50\uCCB4",
      location: "\uC11C\uC6B8 \uAC15\uB0A8\uAD6C",
      scale: "\uC911\uD615 (\uBD80\uBD84 \uB9AC\uBAA8\uB378\uB9C1)",
      duration: "2\uC8FC",
      year: 2024,
      coverImg: "/images/portfolio-1.jpg",
      images: ["/images/portfolio-1.jpg", "/images/portfolio-hero.jpg"],
      description: "\uAE30\uC874 \uC624\uD06C \uC6D0\uBAA9 \uCE90\uBE44\uB137\uC744 \uBB34\uAD11\uD0DD \uD654\uC774\uD2B8 \uD50C\uB7AB \uD328\uB110\uB85C \uAD50\uCCB4\uD558\uACE0, \uB9C8\uBE14 \uD328\uD134 \uC6CC\uD06C\uD0D1\uACFC \uC5F0\uACB0\uB418\uB294 \uD1B5\uD569 \uC8FC\uBC29\uC73C\uB85C \uC644\uC131\uD588\uC2B5\uB2C8\uB2E4.",
      tags: ["\uCE90\uBE44\uB137", "\uC8FC\uBC29", "\uBAA9\uACF5"],
      materials: ["\uD50C\uB78C\uD654\uBC31 \uD3EC\uB9BC\uC54C\uBB34\uAD11", "\uD398\uB2C8\uC5BC \uD321 \uC2AC\uB77C\uC774\uB529 \uD589\uAC70 \uC2DC\uC2A4\uD15C", "\uC2F8\uC2DC \uD30C\uD2B8\uB108 \uD780\uC9C0"],
    },
    {
      id: "p3",
      title: "\uC6CC\uD06C\uC778\uD074\uB85C\uC9F3 \uB4DC\uB808\uC2A4\uB8F8 \uD508\uD130\uB9AC\uC5B4",
      location: "\uC11C\uC6B8 \uC131\uB3D9\uAD6C",
      scale: "\uC18C\uD615 (\uBD80\uBD84 \uC218\uB9AC)",
      duration: "1\uC8FC",
      year: 2023,
      coverImg: "/images/portfolio-2.jpg",
      images: ["/images/portfolio-2.jpg", "/images/portfolio-3.jpg"],
      description: "\uC6CC\uD06C\uC778\uD074\uB85C\uC9F3 \uB4DC\uB808\uC2A4\uB8F8\uC744 \uCC9C\uC7A5\uAE4C\uC9C0 \uCF5C\uB809\uC158 \uCC3D\uACE0\uB85C \uAD6C\uC131\uD558\uACE0 \uC5EC\uC131\uC758 \uB3D9\uC120\uC5D0 \uB9DE\uB294 \uC870\uBA85 \uB3D9\uC120\uC744 \uC124\uCE58\uD588\uC2B5\uB2C8\uB2E4.",
      tags: ["\uB4DC\uB808\uC2A4\uB8F8", "\uBE4C\uD2B8\uC778", "\uC870\uBA85"],
      materials: ["\uC624\uD06C \uBCA0\uB2C8\uC5B4 \uD569\uD310", "\uD328\uB2C9 \uB808\uC77C \uC2AC\uB77C\uC774\uB529 \uC2DC\uC2A4\uD15C", "\uD544\uB9BD\uC2A4 \uC218\uB099 \uD589\uAC70"],
    },
    {
      id: "p4",
      title: "\uC131\uC218\uB3D9 \uCE74\uD398 \uCE74\uC6B4\uD130 \uBC14 \uC2DC\uACF5",
      location: "\uC11C\uC6B8 \uC131\uB3D9\uAD6C",
      scale: "\uC911\uD615 (\uC0C1\uC5C5 \uACF5\uAC04)",
      duration: "3\uC8FC",
      year: 2023,
      coverImg: "/images/portfolio-4.jpg",
      images: ["/images/portfolio-4.jpg", "/images/portfolio-3.jpg"],
      description: "\uCE74\uD398 \uC778\uD14C\uB9AC\uC5B4 \uC804\uCCB4\uB97C \uC6D0\uBAA9 \uBC14 \uCE74\uC6B4\uD130\uC640 \uBCA0\uC6D0\uD654 \uD328\uB110 \uC6B8\uB85C \uB9C8\uAC10\uD588\uC2B5\uB2C8\uB2E4. \uBE0C\uB79C\uB4DC \uCEE8\uC149\uD2B8\uC5D0 \uB9DE\uCDB0 \uADE0\uC77C\uD55C \uC6B0\uB4DC\uD1E4\uC2A4\uCCD0\uB85C \uD1B5\uC77C\uAC10\uC744 \uC8FC\uC5C8\uC2B5\uB2C8\uB2E4.",
      tags: ["\uC0C1\uC5C5\uACF5\uAC04", "\uCE74\uC6B4\uD130", "\uCE74\uD398"],
      materials: ["\uBE14\uB799 \uC6F9\uB4DC \uBB34\uAD11 \uD569\uD310", "\uD754\uCCB4 \uBD99\uC0B0 \uC2A4\uD2F8\uB808\uC2A4 \uD53C\uD305", "\uD398\uB2C8\uC5BC \uBAA9\uAC15 \uC1FC\uCF00\uC774\uC2A4"],
    },
    {
      id: "p5",
      title: "\uD310\uAD50 \uC8FC\uD0DD \uD648\uC624\uD53C\uC2A4 \uBE4C\uD2B8\uC778",
      location: "\uACBD\uAE30\uB3C4 \uC131\uB0A8\uC2DC",
      scale: "\uC18C\uD615 (\uBD80\uBD84 \uC218\uB9AC)",
      duration: "1\uC8FC",
      year: 2023,
      coverImg: "/images/portfolio-3.jpg",
      images: ["/images/portfolio-3.jpg", "/images/portfolio-2.jpg"],
      description: "\uC7AC\uD0DD\uADFC\uBB34 \uACF5\uAC04\uC744 \uC704\uD55C \uD648\uC624\uD53C\uC2A4 \uD648 \uBC14\uB2E5\uBD80\uD130 \uCC9C\uC7A5\uAE4C\uC9C0 \uC6D0\uBAA9 \uBE4C\uD2B8\uC778 \uD68C\uB85C\uCC45\uC0C1\uACFC \uC218\uB098 \uC218\uB098\uC2DD \uCC45\uAF34 \uAD6C\uC131\uC73C\uB85C \uAC08\uBB4C\uD558\uACE0 \uAE30\uB2A5\uC801\uC778 \uACF5\uAC04\uC744 \uC644\uC131\uD588\uC2B5\uB2C8\uB2E4.",
      tags: ["\uD648\uC624\uD53C\uC2A4", "\uBE4C\uD2B8\uC778", "\uBAA9\uACF5"],
      materials: ["\uCC9C\uC5F0 \uC225\uB098\uBB34 \uD508\uC2A4\uB2C8\uC5B4", "\uC624\uB9AC\uC2A4 \uD314\uB808\uD2B8 \uB2A5\uCC38\uB098\uBB34 \uD569\uD310", "\uC2A4\uB9AC\uC2A4 \uBD84\uD544\uBC29\uC2DD \uCC45\uAF34 \uB808\uC77C"],
    },
    {
      id: "p6",
      title: "\uC774\uD0DC\uC6D0 \uC2E0\uC0C1 \uB9E4\uC7A5 \uBB38\uC774\uD310 \uC81C\uC791",
      location: "\uC11C\uC6B8 \uC11C\uCD08\uAD6C",
      scale: "\uC18C\uD615 (\uBD80\uBD84 \uC218\uB9AC)",
      duration: "3\uC77C",
      year: 2022,
      coverImg: "/images/portfolio-4.jpg",
      images: ["/images/portfolio-4.jpg"],
      description: "\uBE0C\uB79C\uB4DC \uC544\uC774\uB374\uD2F0\uD2F0\uC5D0 \uB9DE\uB294 \uBB38\uC774\uD310 \uBC18\uD611\uC7A5 \uC81C\uC791 \uBC0F \uC2DC\uACF5\uC73C\uB85C \uAC00\uAC8C \uC785\uAD6C\uBD80\uC758 \uD1B5\uC77C\uAC10\uC744 \uB192\uC600\uC2B5\uB2C8\uB2E4.",
      tags: ["\uBB38\uC774\uD310", "\uC0C1\uC5C5", "\uC81C\uC791"],
      materials: ["\uAC80\uC740\uD638\uB450\uB098\uBB34 \uBB34\uAD11 \uD569\uD310", "\uC2A4\uD14C\uC778\uB9AC\uC2A4 \uD53C\uD305"],
    },
  ],

  experience: [
    {
      period: "2019 \u2014 \uD604\uC7AC",
      company: "KCS \uBAA9\uACF5 (\uAC1C\uC778 \uC2A4\uD29C\uB514\uC624)",
      role: "\uB300\uD45C \uBAA9\uC218 / \uD504\uB9AC\uB79C\uC11C",
      description: "\uD504\uB9AC\uBBF8\uC5C4 \uC8FC\uAC70 \uBC0F \uC0C1\uC5C5 \uACF5\uAC04 \uC804\uBB38, \uC5F0 40\uC5EC \uD604\uC7A5 \uB2F4\uB2F9",
    },
    {
      period: "2014 \u2014 2019",
      company: "\uD55C\uC7FC\uC778\uD14C\uB9AC\uC5B4",
      role: "\uC218\uC11D \uBAA9\uC218",
      description: "\uAC15\uB0A8\uAD6C \uB7ED\uC154\uB9AC \uC544\uD30C\uD2B8 \uB9AC\uBAA8\uB378\uB9C1 \uC8FC\uB3C4, \uD300\uC7A5 \uC5ED\uD560 \uC218\uD589",
    },
    {
      period: "2009 \u2014 2014",
      company: "\uB300\uC6B0\uAC74\uC124",
      role: "\uC778\uD14C\uB9AC\uC5B4 \uBAA9\uACF5",
      description: "\uB300\uD615 \uC544\uD30C\uD2B8 \uB2E8\uC9C0 \uC778\uD14C\uB9AC\uC5B4 \uBAA9\uACF5 \uB2F4\uB2F9, \uAE30\uC220 \uAE30\uBC18 \uD655\uB9BD",
    },
  ],
}
