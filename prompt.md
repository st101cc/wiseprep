# Taiwan Tech Interview Prep — MVP Build Prompt

## 角色設定

你是一位 Senior Full-stack Engineer + Product Designer，擅長 Next.js、Tailwind CSS、shadcn/ui。
請幫我用 **Next.js 14 (App Router) + Tailwind CSS + shadcn/ui** 建立一個台灣科技業面試準備網站 WisePrep 的 **MVP 前端原型**。

---

## 產品定位（一句話）

> 這是「個人化面試準備教練」，不是求職平台。
> 幫助使用者根據「目標公司」與「目標職缺類型」，準備台灣科技業面試。

---

## 技術規格

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **Data**: 全部使用 mock data（`/src/lib/mock-data.ts`），不需要後端、不需要 API、不需要資料庫
- **Icons**: lucide-react
- **字型**: 使用 Google Fonts（建議 `Noto Sans TC` + 一個英文 Display font）

---

## 專案結構

請建立以下檔案結構：

```
src/
├── app/
│   ├── page.tsx                        # Landing Page（首頁）
│   ├── companies/
│   │   ├── page.tsx                    # Company Explorer（公司探索頁）
│   │   └── [slug]/
│   │       └── page.tsx                # Company Detail Page（公司詳情頁）
│   ├── roles/
│   │   └── [roleSlug]/
│   │       └── page.tsx                # Role Preparation Page（職缺類型準備頁）
│   ├── dashboard/
│   │   └── page.tsx                    # Preparation Dashboard（準備進度頁）
│   └── report/
│       └── page.tsx                    # Anonymous Interview Report Form（匿名回報頁）
├── components/
│   ├── layout/
│   │   ├── navbar.tsx
│   │   └── footer.tsx
│   ├── ui/                             # shadcn/ui 元件（自動生成）
│   ├── company-card.tsx
│   ├── interview-flow-timeline.tsx
│   ├── skill-badge.tsx
│   ├── confidence-indicator.tsx
│   ├── preparation-checklist.tsx
│   └── progress-tracker.tsx
└── lib/
    ├── mock-data.ts                    # 所有 mock data 集中於此
    └── types.ts                        # TypeScript types
```

---

## Mock Data 規格（`/src/lib/mock-data.ts`）

請建立以下 mock data，**不需要詳細的公司介紹文字**，只需要結構性資料即可。
每類型約 **5–8 筆**資料即可，重點是資料結構完整、UI 可以跑起來。

### Company（公司）

```typescript
{
  slug: string
  name: string
  nameEn: string
  industry: 'software' | 'semiconductor' | 'ecommerce' | 'fintech' | 'ai' | 'hardware'
  companyType: 'foreign' | 'startup' | 'listed' | 'semiconductor'
  location: string[]           // e.g. ['台北', '新竹']
  commonRoles: string[]        // role slugs，e.g. ['software-engineer', 'data-engineer']
  interviewDataCount: number   // 有幾筆面試資料
  confidenceScore: number      // 0–100
  lastUpdated: string
  hasUserReports: boolean
}
```

建議公司（請自行補充合理的 mock 數值）：
台積電、聯發科、ASUS、趨勢科技、LINE Taiwan、Shopee Taiwan、Appier、91APP、Gogoro、Meta Taiwan、Google Taiwan、AWS Taiwan、Coupang、TSMC、Microsoft Taiwan、NVIDIA Taiwan、AMD Taiwan、Intel Taiwan、Qualcomm Taiwan、Apple Taiwan、Oracle Taiwan、IBM Taiwan、Cisco Taiwan、Synopsys Taiwan、Cadence Taiwan、Micron Taiwan、聯電（UMC）、日月光（ASE）、瑞昱（Realtek）、聯詠（Novatek）、群聯（Phison）、創意電子（GUC）、世芯-KY（Alchip）、智原科技（Faraday）、力旺（eMemory）、祥碩（ASMedia）、華碩、宏碁（Acer）、微星（MSI）、技嘉（GIGABYTE）、鴻海（Foxconn）、廣達（Quanta）、緯創（Wistron）、緯穎（Wiwynn）、和碩（Pegatron）、仁寶（Compal）、台達電（Delta Electronics）、研華（Advantech）、SHOPLINE、iKala、Gogolook、KKCompany、Dcard、Pinkoi、inline、AmazingTalker、VoiceTube、Hahow、KKday、AsiaYo、FunNow、CloudMile、MaiCoin、XREX、BitoPro、國泰數數發、富邦科技、玉山銀行數位科技、中華電信研究院、CHT Security、CyCraft、TeamT5、TXOne Networks、DevCore、PicCollage、Kdan Mobile、Lalamove Taiwan、foodpanda Taiwan、Uber Taiwan、PChome、momo、CoolBitX、AppWorks、aetherAI、InfuseAI、Skymizer、Titansoft、Zeabur

### Role（職缺類型）

```typescript
{
  slug: string
  title: string
  titleZh: string
  category: 'engineering' | 'data' | 'ai' | 'product' | 'design' | 'semiconductor' | 'hardware' | 'security' | 'qa'
  description: string
  requiredSkills: string[]
  niceToHaveSkills: string[]
}
```

支援職缺：
`software-engineer`, `frontend-engineer`, `backend-engineer`, `data-engineer`,
`ml-engineer`, `product-manager`, `ux-designer`, `devops-sre`,
`firmware-engineer`, `hardware-engineer`

### InterviewFlow（面試流程）

這是核心資料，請務必做好結構：

```typescript
{
  id: string
  companySlug: string
  roleSlug: string
  stages: InterviewStage[]
  source: {
    count: number
    hasUserReports: boolean
    isInferred: boolean       // true = 根據相似公司推測，非真實回報
    lastUpdated: string
    confidenceScore: number   // 0–100
  }
}

InterviewStage {ok
  order: number
  name: string               // e.g. 'HR Screening'
  nameZh: string             // e.g. 'HR 初篩'
  estimatedDuration: string  // e.g. '30–45 分鐘'
  format: 'phone' | 'video' | 'onsite' | 'async' | 'test'
  difficulty: 1 | 2 | 3 | 4 | 5
  questionTypes: string[]    // e.g. ['行為題', '薪資期望', '工作動機']
  prepTips: string[]         // 2–3 條準備要點
  interviewerRole: string    // e.g. 'HR', 'Tech Lead', 'Hiring Manager'
}
```

請至少建立以下幾組 InterviewFlow（公司 × 職缺類型的組合）：

| 公司 | 職缺 |
|------|------|
| 趨勢科技 | software-engineer |
| LINE Taiwan | backend-engineer |
| Shopee Taiwan | data-engineer |
| Appier | ml-engineer |
| ASUS | frontend-engineer |
| 台積電 | firmware-engineer |
| 聯發科 | hardware-engineer |
| Google Taiwan | software-engineer |

每個 InterviewFlow 需有 **4–6 個 stages**，每個 stage 資料完整。

---

## 頁面規格

### 1. Landing Page（`app/page.tsx`）

**用途**：清楚說明產品是什麼，吸引使用者進入準備流程。

**包含**：
- Hero section：大標題說明產品用途、CTA 按鈕（「探索台灣科技公司」「分析職缺 JD」）
- 4 個快速入口 card：「我有目標公司」「我有職缺 JD（另開分析頁）」「我想探索台灣科技公司」「根據履歷找方向」
- **注意**：「我有目標公司」入口引導使用者從下拉選單選擇公司與職缺類型；「我有職缺 JD」入口進入獨立的 JD 分析頁面，兩條路徑完全分開，不合併
- 熱門公司 row（橫向捲動 card）
- 熱門職缺類型 grid
- 面試流程範例（用一個 timeline 做示意）
- Footer CTA

**UI 風格**：現代、乾淨、像 SaaS 工具，不要像人力銀行。

---

### 2. Company Explorer（`app/companies/page.tsx`）

**用途**：瀏覽台灣科技公司，找到目標公司進入準備頁。

**包含**：
- 搜尋欄（mock，不需要真正搜尋功能）
- Filter chips：地區、職能、年資、公司類型
- Company card grid（使用 CompanyCard component）
- 每張 card 顯示：公司名、產業 badge、常見職缺類型 badges、面試資料筆數、confidenceScore、最後更新時間、「開始準備」按鈕

**注意**：這不是職缺列表，是公司探索頁。

---

### 3. Company Detail Page（`app/companies/[slug]/page.tsx`）

**用途**：看某間公司的面試流程與準備方向。

**包含**：
- 公司 header（名稱、產業、地點、類型）
- 可選職缺類型 tab（切換不同職缺的面試流程）
- Interview Flow Timeline（核心元件，詳見下方）
- 資料可信度說明（source count、confidence score、是否為推測）
- 若 `isInferred: true`，顯示明顯的提示框：「以下流程為根據相似公司推測，非真實回報資料」
- 準備重點摘要
- CTA：「進入完整準備頁」

---

### 4. Role Preparation Page（`app/roles/[roleSlug]/page.tsx`）

**用途**：針對特定職缺類型的完整準備內容。

**包含**：
- 職缺類型說明
- 必備技能 + 加分技能（SkillBadge 元件）
- 常見面試關卡（從下拉選單選擇公司，切換對應的 InterviewFlow；**不可自行填寫公司名稱**，只能從 mock companies 清單中選）
- 面試題型分類（技術題 / 行為題 / System Design / Case Study）
- 準備 checklist（PreparationChecklist 元件）
- 推薦準備資源（mock 連結即可）

---

### 5. Preparation Dashboard（`app/dashboard/page.tsx`）

**用途**：追蹤個人準備進度。

**包含**：
- 目標公司 + 目標職缺（mock 已選定）
- 整體準備進度 progress bar
- 面試流程各關卡完成狀態（可 toggle）
- 今日任務 list（mock）
- 技術題練習進度（mock 數據）
- 行為題 STAR 練習（mock）
- 準備日曆（簡單的 week view，標記今日）

**注意**：這是 mock dashboard，不需要真正的 state persistence，用 useState 管理即可。

---

### 6. Anonymous Report Form（`app/report/page.tsx`）

**用途**：使用者匿名回報面試流程，貢獻社群資料。

**包含**：
- 說明文字（強調匿名、不蒐集個資）
- 表單欄位：
  - 公司（下拉選單，從 mock companies 選）
  - 職缺類型（下拉）
  - 年資層級（Intern / New Grad / Junior / Mid / Senior / Manager）
  - 面試月份（年月 picker）
  - 面試關卡（可新增多個，每關填名稱、時長、難度）
  - 是否拿到 offer（是 / 否 / Pending）
  - 是否為遠端面試
  - 準備建議（textarea，選填）
- 送出按鈕（mock，toast 提示即可）
- **不要求填 email 或姓名**

---

## 核心 UI 元件規格

### `InterviewFlowTimeline`

這是整個產品最重要的元件。

```
視覺：垂直 timeline，每個 stage 是一個 card
每個 card 包含：
  - 關卡編號 + 名稱（中英文）
  - format badge（視訊 / 現場 / 非同步 / 測驗）
  - estimatedDuration
  - difficulty（1–5 星或點點）
  - questionTypes（badge list）
  - prepTips（條列）
  - interviewerRole
連接線：stages 之間有視覺連接線
若 isInferred: true：整個 timeline 上方加警示橫幅
```

### `ConfidenceIndicator`

顯示資料可信度：
- `confidenceScore` 用長條或圓形視覺呈現
- 顯示 source count、是否有 user reports、最後更新時間
- 分級：High（≥70）/ Medium（40–69）/ Low（<40）

### `SkillBadge`

技能標籤，分色：
- 必備技能：實色
- 加分技能：outline

### `PreparationChecklist`

可勾選的準備清單，分類顯示，記錄勾選狀態（useState）。

---

## UI 風格指引

- **風格定位**：像 Linear / Notion / Vercel 的 SaaS 工具感，不要像 104 人力銀行
- **配色**：深色 navbar + 白底內容區，強調色用藍或靛色，整體色系果凍感一點
- **排版**：清晰層級，善用 card、badge、divider
- **不要**：廣告 banner、過多顏色、Job listing 風格的 table
- **要**：progress indicator、confidence badge、timeline 視覺、checklist

---

## 執行順序建議

請依照以下順序執行，每步完成再繼續：

1. 建立 `src/lib/types.ts`（所有 TypeScript types）
2. 建立 `src/lib/mock-data.ts`（所有 mock data）
3. 安裝並設定 shadcn/ui（若尚未設定）
4. 建立共用 layout 元件（Navbar、Footer）
5. 建立核心 UI 元件（InterviewFlowTimeline、ConfidenceIndicator、SkillBadge 等）
6. 依序建立各頁面（Landing → Companies → Company Detail → Role Prep → Dashboard → Report Form）
7. 確認所有頁面可正常跑起來，沒有 runtime error

---

## 特別注意

- **所有資料都用 mock data**，不需要任何 API 呼叫
- **不需要登入功能**，dashboard 直接顯示 mock 使用者資料
- 若某個公司與職缺的 InterviewFlow 不存在，顯示「目前尚無此組合的面試資料，以下為根據相似職缺推測的準備方向」提示
- **公司與職缺類型的選擇，全站一律只能用下拉選單（Select）**，不得使用自由填寫的文字輸入框；選項來源為 mock data 清單
- JD 分析為獨立流程（獨立頁面或 modal），與「選公司/選職缺」的主流程完全分開；JD textarea 做成 UI 元件即可，不需要真正解析 JD
- 履歷上傳做成 UI 元件即可，不需要真正處理檔案
- **重點是 UI 跑得起來、資料結構正確、核心 InterviewFlow 元件美觀完整**

---

## 完成標準

MVP 完成時，使用者應該能夠：
1. 在首頁選擇目標公司或職缺
2. 若選擇目標公司，可以在公司詳情頁看到完整的 General Interview Flow Timeline
4. 切換不同職缺類型，看到對應的面試流程
5. 進入職缺準備頁，看到技能需求與準備 checklist
6. 進入 Dashboard，看到準備進度（mock 狀態）
7. 填寫匿名回報表單（不需真正送出）
