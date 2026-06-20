import Image from "next/image";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/client/onboarding-form";
import { Panel, Pill, ScreenShell, SectionLabel } from "@/components/primitives";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveChildProfile } from "@/lib/db/repositories";

export const dynamic = "force-dynamic";

const marketingHighlights = [
  {
    title: "懂儿童心理学的 AI 助教",
    text: "先接住孩子的情绪和注意力，再给出适合年龄的提示。",
  },
  {
    title: "一对一施教",
    text: "按识字、拼音、数感掌握情况，动态安排当天练习。",
  },
  {
    title: "长期记忆",
    text: "持续记录孩子容易混淆的字、音和数量关系，不从零开始。",
  },
  {
    title: "报告反馈",
    text: "把练习过程整理成家长能读懂的进步、薄弱点和明日建议。",
  },
];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    const child = await getActiveChildProfile(user.id);
    if (child) {
      redirect("/learn");
    }
  }

  return (
    <ScreenShell title="欢迎使用 AI 辅导" action={<Pill>家长账号</Pill>}>
      <div className="login-landing-grid">
        <section className="hero-copy login-marketing-copy">
          <SectionLabel>幼小衔接 AI 个性化辅导</SectionLabel>
          <h1>懂儿童心理学的 AI 助教</h1>
          <p style={{ marginTop: 28, maxWidth: 560 }}>
            一对一陪孩子练识字、拼音和数感，把每次练习沉淀成长期记忆和清晰报告。
          </p>

          <div className="marketing-tags" aria-label="产品能力">
            <span>儿童心理学引导</span>
            <span>一对一动态施教</span>
            <span>长期学习记忆</span>
            <span>家长报告反馈</span>
          </div>

          <div className="product-showcase" aria-label="AI 辅导产品预览">
            <Image
              alt="AI 辅导学习首页预览"
              className="product-showcase-image"
              height={1048}
              priority
              sizes="(max-width: 980px) 100vw, 54vw"
              src="/assets/marketing-product-preview.png"
              width={1501}
            />
            <div className="showcase-note">
              <strong>从当天练习到长期成长曲线</strong>
              <span>AI 会记住孩子的掌握情况，下一次继续接着教。</span>
            </div>
          </div>
        </section>

        <aside className="login-conversion">
          <div className="learning-scene">
            <Image
              alt="孩子学习识字的桌面场景"
              className="learning-scene-image"
              height={500}
              sizes="(max-width: 980px) 100vw, 40vw"
              src="/assets/study-desk.png"
              width={840}
            />
            <div className="learning-scene-copy">
              <strong>每天短练习</strong>
              <span>少打扰、低压力，把启蒙学习做成可坚持的节奏。</span>
            </div>
          </div>
          <Panel className="login-panel">
            <h2>家长账号</h2>
            <OnboardingForm />
          </Panel>
        </aside>
      </div>

      <section className="marketing-proof-section" aria-label="AI 辅导亮点">
        <div>
          <SectionLabel>学习闭环</SectionLabel>
          <h2>像老师一样理解孩子，也像系统一样记住成长</h2>
        </div>
        <div className="marketing-proof-grid">
          {marketingHighlights.map((item) => (
            <article className="marketing-proof-item" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </ScreenShell>
  );
}
