'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '@/contexts/LangContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

export default function AboutPage() {
  const { lang } = useLang();

  const en = {
    kicker: 'Our story',
    title: 'About Us',
    subtitle:
      'More than a clothing brand — a mindset, a movement, and a reminder that every person is blessed from the moment they are born.',
    story: {
      title: 'The Story Behind BIB',
      paragraphs: [
        'Believe in a Blessed (BIB) was created to inspire people to believe in the blessings that already exist within themselves. In a world filled with doubt, comparison, and negativity, we stand for confidence, purpose, faith, and self-belief.',
        "The meaning behind 'Believe in a Blessed' is simple yet powerful: believe in something or someone that is already blessed. Every opportunity, every challenge, every success, and every lesson carries a blessing.",
        'Every moment in life—whether good or bad—carries a lesson. Believe in those moments, because that is what Believe in a Blessed stands for. Every experience is a blessing in disguise, teaching you to grow, learn, and become stronger.',
        'Our brand exists to remind people to trust their own journey and recognize the greatness that God has placed within them — while finding inspiration in the journeys of others who have achieved success.',
        'Every BIB piece is designed to represent ambition, resilience, gratitude, and purpose. We create fashion that speaks beyond appearance — fashion that carries a message.',
      ],
    },
    vision: {
      title: 'Our Vision',
      description:
        'To build a globally recognized lifestyle brand that inspires millions of people to believe in their purpose, embrace their blessings, and live with confidence.',
    },
    mission: {
      title: 'Our Mission',
      description:
        'To create high-quality fashion that inspires faith, self-belief, and positive living while building a community of people who choose purpose over doubt and growth over limitations.',
    },
    valuesTitle: 'What We Stand For',
    valuesSubtitle: 'Values that guide every decision, design, and relationship.',
    values: [
      { title: 'Faith & Gratitude', desc: 'Every blessing begins with faith and appreciation.' },
      { title: 'Purpose', desc: 'Everything we create carries meaning and a greater vision.' },
      { title: 'Self-Belief', desc: 'Success starts when people believe in the blessings they already possess.' },
      { title: 'Excellence', desc: 'We are committed to quality, creativity, and continuous improvement.' },
      { title: 'Community', desc: 'We grow together, inspire one another, and celebrate each journey.' },
      { title: 'Positive Impact', desc: 'Our goal is not only to create products, but inspiration that changes lives.' },
    ],
    cta: {
      title: 'Join the Movement',
      desc: 'Wear your faith. Share your story. Be a blessing.',
      shop: 'Shop Collection',
      contact: 'Contact Us',
    },
  };

  const sw = {
    kicker: 'Hadithi yetu',
    title: 'Kuhusu Sisi',
    subtitle:
      'Zaidi ya chapa ya nguo — mtazamo, mwendo, na ukumbusho kwamba kila mtu amebarikiwa tangu kuzaliwa.',
    story: {
      title: 'Hadithi Nyuma ya BIB',
      paragraphs: [
        'Believe in a Blessed (BIB) iliundwa ili kuwahimiza watu kuamini baraka ambazo tayari zipo ndani mwao. Katika ulimwengu uliojaa shaka, kulinganisha, na uzembe, tunasimama kwa ujasiri, kusudi, imani, na kujiamini.',
        "Maana ya 'Believe in a Blessed' ni rahisi lakini yenye nguvu: amini kitu au mtu ambaye tayari amebarikiwa. Kila fursa, kila changamoto, kila mafanikio, na kila somo hubeba baraka.",
        'Kila dakika ya maisha — iwe nzuri au mbaya — hubeba somo. Amini muda huo, kwa sababu ndiyo Believe in a Blessed inasimama kwa. Kila uzoefu ni baraka iliyofichwa.',
        'Chapa yetu ipo kuwakumbusha watu kuamini safari yao wenyewe na kutambua ukuu ambao Mungu amewaweka ndani yao.',
        'Kila kipande cha BIB kimeundwa kuwakilisha tamaa, ustahimilivu, shukrani, na kusudi. Tunaunda mitindo inayobeba ujumbe.',
      ],
    },
    vision: {
      title: 'Maono Yetu',
      description:
        'Kujenga chapa ya kimataifa ya mtindo wa maisha inayowahimiza mamilioni ya watu kuamini kusudi lao, kukumbatia baraka zao, na kuishi kwa ujasiri.',
    },
    mission: {
      title: 'Dhamira Yetu',
      description:
        'Kuunda bidhaa za hali ya juu za mitindo zinazochochea imani, kujiamini, na maisha chanya huku tukijenga jamii ya watu wanaochagua kusudi badala ya shaka.',
    },
    valuesTitle: 'Tunachosimama',
    valuesSubtitle: 'Thamani za msingi zinazoongoza kila uamuzi, muundo, na uhusiano.',
    values: [
      { title: 'Imani na Shukrani', desc: 'Kila baraka huanza na imani na shukrani.' },
      { title: 'Kusudi', desc: 'Kila kitu tunachounda kina maana na kinawakilisha maono makubwa.' },
      { title: 'Kujiamini', desc: 'Mafanikio huanza watu wanapoamini baraka walizonazo tayari.' },
      { title: 'Uzalendo', desc: 'Tumejitolea kwa ubora, ubunifu, na uboreshaji endelevu.' },
      { title: 'Jamii', desc: 'Tunakua pamoja, tunahimizana, na kusherehekea safari za kila mmoja.' },
      { title: 'Athari Chanya', desc: 'Lengo letu si tu kuunda bidhaa bali kuunda msukumo unaobadilisha maisha.' },
    ],
    cta: {
      title: 'Jiunge na Harakati',
      desc: 'Vaa imani yako. Shiriki hadithi yako. Kuwa baraka.',
      shop: 'Nunua Mkusanyiko',
      contact: 'Wasiliana Nasi',
    },
  };

  const content = lang === 'sw' ? sw : en;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] pb-20 pt-16 md:pb-0">
      <Navbar />

      <section className="relative isolate min-h-[52vh] overflow-hidden bg-stone-900 sm:min-h-[58vh]">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&h=1000&fit=crop&auto=format"
          alt="BelieveinaBlessed atelier"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/30" />
        <div className="relative z-10 flex min-h-[52vh] flex-col justify-end px-5 pb-14 pt-28 sm:min-h-[58vh] sm:px-10 lg:px-16 lg:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <p className="mb-4 font-display text-sm font-semibold tracking-[0.28em] text-white/85 uppercase">
              BelieveinaBlessed · {content.kicker}
            </p>
            <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-tight text-white">
              {content.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              {content.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="home-shell py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
          >
            <p className="section-kicker">Origin</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              {content.story.title}
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              {content.story.paragraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="space-y-4"
          >
            <div className="border border-[var(--border)] bg-[var(--surface-warm)] p-6 sm:p-8">
              <p className="section-kicker">Vision</p>
              <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--text)]">
                {content.vision.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                {content.vision.description}
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8">
              <p className="section-kicker">Mission</p>
              <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--text)]">
                {content.mission.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                {content.mission.description}
              </p>
            </div>
          </motion.div>
        </div>

        <section className="mt-20 border-t border-[var(--border)] pt-16 sm:mt-24 sm:pt-20">
          <div className="mb-10 max-w-2xl">
            <p className="section-kicker">Values</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              {content.valuesTitle}
            </h2>
            <p className="mt-3 text-sm text-[var(--text-secondary)] sm:text-base">
              {content.valuesSubtitle}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="border border-[var(--border)] bg-[var(--bg-card)] p-6 transition hover:border-teal-700/40"
              >
                <span className="font-display text-sm font-semibold tracking-[0.18em] text-teal-700 uppercase dark:text-teal-300">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-[var(--text)]">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {value.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-16 border border-[var(--border)] bg-[var(--surface-warm)] px-6 py-12 sm:mt-20 sm:px-10 sm:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="section-kicker">BelieveinaBlessed</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
                {content.cta.title}
              </h2>
              <p className="mt-3 text-sm text-[var(--text-secondary)] sm:text-base">
                {content.cta.desc}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-neutral-950 px-6 py-3.5 text-sm font-semibold tracking-tight text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
              >
                {content.cta.shop} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-neutral-950 px-6 py-3.5 text-sm font-semibold tracking-tight text-neutral-950 transition hover:bg-neutral-950 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-neutral-950"
              >
                {content.cta.contact} <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
      <BottomNav />
    </main>
  );
}
