export const SPECIALTIES = ["\uC804\uCCB4", "\uBAA9\uACF5", "\uD0C0\uC77C", "\uC804\uAE30", "\uB3C4\uBC30", "\uC124\uBE44", "\uBBF8\uC7A5", "\uD398\uC778\uD2B8"]

export const EXPERIENCE_OPTIONS = ["\uC804\uCCB4", "3\uB144 \uC774\uD558", "3~10\uB144", "10\uB144 \uC774\uC0C1"]

export const VERIFICATION_OPTIONS = ["\uBAA8\uB4E0 \uC6CC\uCEE4", "\uC790\uACA9\uC99D \uC778\uC99D\uB428", "Bluecollar CV \uC778\uC99D \uC644\uB8CC"]

export const SCALE_OPTIONS = ["\uC804\uCCB4", "\uC18C\uD615 (\uBD80\uBD84 \uC218\uB9AC)", "\uC911\uD615 (\uC8FC\uAC70 \uC804\uCCB4)", "\uB300\uD615 (\uC0C1\uC5C5 \uACF5\uAC04)"]

export const SORT_OPTIONS = ["\uC778\uAE30\uC21C", "\uCD5C\uC2E0\uC21C", "\uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uB9CE\uC740 \uC21C"]

export const SCALE_SM = "\uC18C\uD615 (\uBD80\uBD84 \uC218\uB9AC)" as const
export const SCALE_MD = "\uC911\uD615 (\uC8FC\uAC70 \uC804\uCCB4)" as const
export const SCALE_LG = "\uB300\uD615 (\uC0C1\uC5C5 \uACF5\uAC04)" as const

export interface Project {
  id: number
  title: string
  category: string
  img: string
  worker: string
  workerImg: string
  scale: typeof SCALE_SM | typeof SCALE_MD | typeof SCALE_LG
}

export interface Worker {
  id: number
  name: string
  specialty: string[]
  rating: number
  reviews: number
  region: string
  img: string
  years: number
  verified: boolean
  cvVerified: boolean
  portfolioCount: number
}

export const PROJECTS: Project[] = [
  { id: 1, title: "\uAC15\uB0A8 \uC544\uD30C\uD2B8 \uC8FC\uBC29 \uD0C0\uC77C \uC2DC\uACF5", category: "\uD0C0\uC77C", img: "/images/project-tile-work.jpg", worker: "\uCD5C\uC9C0\uC5F0", workerImg: "/images/worker-avatar-4.jpg", scale: SCALE_MD },
  { id: 2, title: "\uD310\uAD50 \uC8FC\uD0DD \uC6D0\uBAA9 \uB9C8\uB8E8 \uC124\uCE58", category: "\uBAA9\uACF5", img: "/images/project-woodwork.jpg", worker: "\uAE40\uCCA0\uC218", workerImg: "/images/worker-avatar-1.jpg", scale: SCALE_MD },
  { id: 3, title: "\uB9C8\uD3EC \uC624\uD53C\uC2A4 \uC804\uAE30 \uBC30\uC120 \uACF5\uC0AC", category: "\uC804\uAE30", img: "/images/project-electrical.jpg", worker: "\uBC15\uBBFC\uC900", workerImg: "/images/worker-avatar-2.jpg", scale: SCALE_LG },
  { id: 4, title: "\uC11C\uCD08 \uBE4C\uB77C \uC804\uCCB4 \uB3C4\uBC30 \uB9AC\uBAA8\uB378\uB9C1", category: "\uB3C4\uBC30", img: "/images/project-wallpaper.jpg", worker: "\uC774\uC0C1\uD638", workerImg: "/images/worker-avatar-3.jpg", scale: SCALE_MD },
  { id: 5, title: "\uC131\uBD81 \uC8FC\uD0DD \uC695\uC2E4 \uBC30\uAD00 \uAD50\uCCB4", category: "\uC124\uBE44", img: "/images/project-plumbing.jpg", worker: "\uBC15\uBBFC\uC900", workerImg: "/images/worker-avatar-2.jpg", scale: SCALE_SM },
  { id: 6, title: "\uC6A9\uC0B0 \uC0C1\uAC00 \uB0B4\uBD80 \uB3C4\uC7A5 \uACF5\uC0AC", category: "\uD398\uC778\uD2B8", img: "/images/project-painting.jpg", worker: "\uC774\uC0C1\uD638", workerImg: "/images/worker-avatar-3.jpg", scale: SCALE_LG },
  { id: 7, title: "\uC740\uD3C9 \uC544\uD30C\uD2B8 \uBBF8\uC7A5 \uB9C8\uAC10 \uC791\uC5C5", category: "\uBBF8\uC7A5", img: "/images/project-plastering.jpg", worker: "\uC724\uB3D9\uD601", workerImg: "/images/worker-avatar-3.jpg", scale: SCALE_SM },
  { id: 8, title: "\uC1A1\uD30C \uC2E0\uCD95 \uBC14\uB2E5 \uD0C0\uC77C \uC804\uCCB4 \uC2DC\uACF5", category: "\uD0C0\uC77C", img: "/images/project-tile-work.jpg", worker: "\uCD5C\uC9C0\uC5F0", workerImg: "/images/worker-avatar-4.jpg", scale: SCALE_LG },
  { id: 9, title: "\uBD84\uB2F9 \uC0AC\uBB34\uC2E4 \uD30C\uD2F0\uC158 \uBAA9\uACF5 \uC2DC\uACF5", category: "\uBAA9\uACF5", img: "/images/project-woodwork.jpg", worker: "\uC815\uB300\uD604", workerImg: "/images/worker-avatar-1.jpg", scale: SCALE_MD },
  { id: 10, title: "\uB3D9\uC791 \uC2E0\uD63C\uC9D1 \uBCBD\uC9C0 \uB3C4\uBC30", category: "\uB3C4\uBC30", img: "/images/project-wallpaper.jpg", worker: "\uC11C\uC9C0\uC6B0", workerImg: "/images/worker-avatar-4.jpg", scale: SCALE_SM },
  { id: 11, title: "\uAC15\uC11C \uC624\uD53C\uC2A4\uD154 \uC804\uAE30 \uC99D\uC124 \uACF5\uC0AC", category: "\uC804\uAE30", img: "/images/project-electrical.jpg", worker: "\uD55C\uC18C\uD76C", workerImg: "/images/worker-avatar-2.jpg", scale: SCALE_LG },
  { id: 12, title: "\uB178\uC6D0 \uBE4C\uB77C \uC695\uC2E4 \uC804\uCCB4 \uAC1C\uBCF4\uC218", category: "\uC124\uBE44", img: "/images/project-plumbing.jpg", worker: "\uBC15\uBBFC\uC900", workerImg: "/images/worker-avatar-2.jpg", scale: SCALE_MD },
  { id: 13, title: "\uC911\uAD6C \uCE74\uD398 \uC778\uD14C\uB9AC\uC5B4 \uB3C4\uC7A5", category: "\uD398\uC778\uD2B8", img: "/images/project-painting.jpg", worker: "\uC724\uB3D9\uD601", workerImg: "/images/worker-avatar-3.jpg", scale: SCALE_SM },
  { id: 14, title: "\uAD11\uC9C4 \uC544\uD30C\uD2B8 \uBBF8\uC7A5 \uC804\uBA74 \uBCF4\uC218", category: "\uBBF8\uC7A5", img: "/images/project-plastering.jpg", worker: "\uCD5C\uC9C0\uC5F0", workerImg: "/images/worker-avatar-4.jpg", scale: SCALE_MD },
  { id: 15, title: "\uC11C\uC6B8\uC232 \uD0C0\uC6B4\uD558\uC6B0\uC2A4 \uB9C8\uB8E8 \uAD50\uCCB4", category: "\uBAA9\uACF5", img: "/images/project-woodwork.jpg", worker: "\uAE40\uCCA0\uC218", workerImg: "/images/worker-avatar-1.jpg", scale: SCALE_LG },
  { id: 16, title: "\uD64D\uB300 \uC8FC\uC810 \uBC14\uB2E5 \uD0C0\uC77C \uC804\uBA74 \uAD50\uCCB4", category: "\uD0C0\uC77C", img: "/images/project-tile-work.jpg", worker: "\uCD5C\uC9C0\uC5F0", workerImg: "/images/worker-avatar-4.jpg", scale: SCALE_LG },
]

export const WORKERS: Worker[] = [
  { id: 1, name: "\uAE40\uCCA0\uC218", specialty: ["\uBAA9\uACF5", "\uD0C0\uC77C"], rating: 4.9, reviews: 138, region: "\uC11C\uC6B8\u00B7\uACBD\uAE30", img: "/images/worker-avatar-1.jpg", years: 15, verified: true, cvVerified: true, portfolioCount: 42 },
  { id: 2, name: "\uBC15\uBBFC\uC900", specialty: ["\uC804\uAE30", "\uC124\uBE44"], rating: 4.8, reviews: 97, region: "\uC778\uCC9C\u00B7\uACBD\uAE30", img: "/images/worker-avatar-2.jpg", years: 8, verified: true, cvVerified: false, portfolioCount: 31 },
  { id: 3, name: "\uC774\uC0C1\uD638", specialty: ["\uB3C4\uBC30", "\uD398\uC778\uD2B8"], rating: 4.9, reviews: 215, region: "\uC11C\uC6B8 \uC804 \uC9C0\uC5ED", img: "/images/worker-avatar-3.jpg", years: 22, verified: true, cvVerified: true, portfolioCount: 58 },
  { id: 4, name: "\uCD5C\uC9C0\uC5F0", specialty: ["\uD0C0\uC77C", "\uBBF8\uC7A5"], rating: 4.7, reviews: 64, region: "\uC11C\uC6B8\u00B7\uC218\uC6D0", img: "/images/worker-avatar-4.jpg", years: 6, verified: true, cvVerified: false, portfolioCount: 19 },
  { id: 5, name: "\uC815\uB300\uD604", specialty: ["\uBAA9\uACF5"], rating: 4.8, reviews: 102, region: "\uBD80\uC0B0\u00B7\uACBD\uB0A8", img: "/images/worker-avatar-1.jpg", years: 12, verified: false, cvVerified: false, portfolioCount: 27 },
  { id: 6, name: "\uD55C\uC18C\uD76C", specialty: ["\uC124\uBE44", "\uC804\uAE30"], rating: 4.9, reviews: 88, region: "\uB300\uAD6C\u00B7\uACBD\uBD81", img: "/images/worker-avatar-2.jpg", years: 9, verified: true, cvVerified: true, portfolioCount: 24 },
  { id: 7, name: "\uC724\uB3D9\uD601", specialty: ["\uBBF8\uC7A5", "\uD398\uC778\uD2B8"], rating: 4.6, reviews: 51, region: "\uAD11\uC8FC\u00B7\uC804\uB0A8", img: "/images/worker-avatar-3.jpg", years: 4, verified: false, cvVerified: false, portfolioCount: 12 },
  { id: 8, name: "\uC11C\uC9C0\uC6B0", specialty: ["\uB3C4\uBC30"], rating: 4.8, reviews: 76, region: "\uC11C\uC6B8\u00B7\uACBD\uAE30", img: "/images/worker-avatar-4.jpg", years: 7, verified: true, cvVerified: false, portfolioCount: 21 },
  { id: 9, name: "\uAC15\uD0DC\uC591", specialty: ["\uC804\uAE30"], rating: 4.7, reviews: 43, region: "\uC11C\uC6B8 \uAC15\uB0A8", img: "/images/worker-avatar-1.jpg", years: 2, verified: false, cvVerified: false, portfolioCount: 8 },
  { id: 10, name: "\uC784\uCC44\uC6D0", specialty: ["\uBAA9\uACF5", "\uBBF8\uC7A5"], rating: 4.9, reviews: 177, region: "\uC11C\uC6B8\u00B7\uACBD\uAE30", img: "/images/worker-avatar-2.jpg", years: 18, verified: true, cvVerified: true, portfolioCount: 65 },
  { id: 11, name: "\uC624\uC138\uD6C8", specialty: ["\uD0C0\uC77C", "\uC124\uBE44"], rating: 4.8, reviews: 59, region: "\uC778\uCC9C", img: "/images/worker-avatar-3.jpg", years: 11, verified: true, cvVerified: false, portfolioCount: 33 },
  { id: 12, name: "\uBB38\uC9C0\uD604", specialty: ["\uB3C4\uBC30", "\uD398\uC778\uD2B8", "\uBBF8\uC7A5"], rating: 4.7, reviews: 92, region: "\uC11C\uC6B8 \uAC15\uC11C", img: "/images/worker-avatar-4.jpg", years: 5, verified: true, cvVerified: true, portfolioCount: 26 },
  { id: 13, name: "\uBC30\uC131\uBBFC", specialty: ["\uC804\uAE30", "\uC124\uBE44"], rating: 4.6, reviews: 38, region: "\uACBD\uAE30 \uBD81\uBD80", img: "/images/worker-avatar-1.jpg", years: 3, verified: false, cvVerified: false, portfolioCount: 9 },
  { id: 14, name: "\uB958\uACBD\uD638", specialty: ["\uBAA9\uACF5"], rating: 4.9, reviews: 201, region: "\uC11C\uC6B8 \uC804 \uC9C0\uC5ED", img: "/images/worker-avatar-2.jpg", years: 25, verified: true, cvVerified: true, portfolioCount: 77 },
  { id: 15, name: "\uC2E0\uBBF8\uB798", specialty: ["\uD0C0\uC77C"], rating: 4.8, reviews: 115, region: "\uC11C\uC6B8\u00B7\uACBD\uAE30", img: "/images/worker-avatar-3.jpg", years: 13, verified: true, cvVerified: true, portfolioCount: 40 },
  { id: 16, name: "\uC870\uD604\uC6B0", specialty: ["\uD398\uC778\uD2B8"], rating: 4.7, reviews: 67, region: "\uC218\uC6D0\u00B7\uD654\uC131", img: "/images/worker-avatar-4.jpg", years: 6, verified: false, cvVerified: false, portfolioCount: 18 },
]
