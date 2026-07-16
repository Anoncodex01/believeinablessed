'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLang } from '@/contexts/LangContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
  const { lang } = useLang();

  // Framer motion variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  // English Content
  const en = {
    title: "About Us",
    subtitle: "More than just a clothing brand — a mindset, a movement, and a reminder that every person is blessed from the moment they are born.",
    story: {
      title: "The Story Behind BIB",
      description: "Believe in a Blessed (BIB) was created to inspire people to believe in the blessings that already exist within themselves. In a world filled with doubt, comparison, and negativity, we stand for confidence, purpose, faith, and self-belief.",
      description2: "The meaning behind 'Believe in a Blessed' is simple yet powerful: believe in something or someone that is already blessed. Every opportunity, every challenge, every success, and every lesson carries a blessing.",
      descriptionExtra: "Every moment in life—whether good or bad—carries a lesson. Believe in those moments, because that's what Believe in a Blessed (BIB) stands for. Every experience is a blessing in disguise, teaching you to grow, learn, and become stronger. When you choose learning over hatred, growth over regret, that's when you become greater.",
      descriptionBrand: "Our brand exists to remind people to trust their own journey and recognize the greatness that God has placed within them. while finding inspiration in the journeys of others who have achieved success in a field.",
      description3: "Every BIB piece is designed to represent ambition, resilience, gratitude, and purpose. We create fashion that speaks beyond appearance — fashion that carries a message."
    },
    vision: {
      title: "Our Vision",
      description: "To build a globally recognized lifestyle and luxury brand that inspires millions of people to believe in their purpose, embrace their blessings, and live with confidence."
    },
    mission: {
      title: "Our Mission",
      description: "To create high-quality fashion and lifestyle products that inspire faith, self-belief, and positive living while building a community of individuals who choose purpose over doubt and growth over limitations."
    },
    values: [
      { title: "Faith & Gratitude", desc: "We believe every blessing begins with faith and appreciation." },
      { title: "Purpose", desc: "Everything we create carries meaning and represents a greater vision." },
      { title: "Self-Belief", desc: "Success starts when people believe in the blessings they already possess." },
      { title: "Excellence", desc: "We are committed to quality, creativity, and continuous improvement." },
      { title: "Community", desc: "We grow together, inspire one another, and celebrate each other's journey." },
      { title: "Positive Impact", desc: "Our goal is not only to create products but to create inspiration that changes lives." }
    ],
    cta: {
      title: "Join the Movement",
      desc: "Wear your faith. Share your story. Be a blessing.",
      button: "Shop Our Collection"
    }
  };

  // Swahili Content
  const sw = {
    title: "Kuhusu Sisi",
    subtitle: "Zaidi ya chapa ya nguo — mtazamo, mwendo, na ukumbusho kwamba kila mtu amebarikiwa tangu kuzaliwa.",
    story: {
      title: "Hadithi Nyuma ya BIB",
      description: "Believe in a Blessed (BIB) iliundwa ili kuwahimiza watu kuamini baraka ambazo tayari zipo ndani mwao. Katika ulimwengu uliojaa shaka, kulinganisha, na uzembe, tunasimama kwa ujasiri, kusudi, imani, na kujiamini.",
      description2: "Maana ya 'Believe in a Blessed' ni rahisi lakini yenye nguvu: amini kitu au mtu ambaye tayari amebarikiwa. Kila fursa, kila changamoto, kila mafanikio, na kila somo hubeba baraka.",
      descriptionExtra: "Every moment in life—whether good or bad—carries a lesson. Believe in those moments, because that's what Believe in a Blessed (BIB) stands for. Every experience is a blessing in disguise, teaching you to grow, learn, and become stronger. When you choose learning over hatred, growth over regret, that's when you become greater.",
      descriptionBrand: "Chapa yetu ipo kuwakumbusha watu kuamini safari yao wenyewe. Kuamini safari yao wenyewe huku wakipata msukumo kutoka kwa safari za wengine waliofanikiwa katika nyanja mbalimbali.",
      description3: "Kila kipande cha BIB kimeundwa kuwakilisha tamaa, ustahimilivu, shukrani, na kusudi. Tunaunda mitindo inayozungumza zaidi ya sura — mitindo inayobeba ujumbe."
    },
    vision: {
      title: "Maono Yetu",
      description: "Kujenga chapa ya kimataifa ya mtindo wa maisha na kifahari inayowahimiza mamilioni ya watu kuamini kusudi lao, kukumbatia baraka zao, na kuishi kwa ujasiri."
    },
    mission: {
      title: "Dhamira Yetu",
      description: "Kuunda bidhaa za hali ya juu za mitindo na mtindo wa maisha zinazochochea imani, kujiamini, na maisha chanya huku tukijenga jamii ya watu wanaochagua kusudi badala ya shaka na ukuaji badala ya vikwazo."
    },
    values: [
      { title: "Imani na Shukrani", desc: "Tunaamini kila baraka huanza na imani na shukrani." },
      { title: "Kusudi", desc: "Kila kitu tunachounda kina maana na kinawakilisha maono makubwa." },
      { title: "Kujiamini", desc: "Mafanikio huanza watu wanapoamini baraka walizonazo tayari." },
      { title: "Uzalendo", desc: "Tumejitolea kwa ubora, ubunifu, na uboreshaji endelevu." },
      { title: "Jamii", desc: "Tunakua pamoja, tunahimizana, na kusherehekea safari za kila mmoja." },
      { title: "Athari Chanya", desc: "Lengo letu si tu kuunda bidhaa bali kuunda msukumo unaobadilisha maisha." }
    ],
    cta: {
      title: "Jiunge na Harakati",
      desc: "Vaa imani yako. Shiriki hadithi yako. Kuwa baraka.",
      button: "Nunua Mkusanyiko Wetu"
    }
  };

  const content = lang === 'en' ? en : sw;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[var(--bg)] pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/5" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium mb-4">
                <span>✦</span>
                <span>{lang === 'en' ? 'Our Story' : 'Hadithi Yetu'}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-[var(--text)] mb-6">
                {content.title}
              </h1>
              <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                {content.subtitle}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Story Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {/* Story Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 text-xl">
                  ✦
                </div>
                <h2 className="text-2xl font-bold text-[var(--text)]">{content.story.title}</h2>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                {content.story.description}
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                {content.story.description2}
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                {content.story.descriptionExtra}
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                {content.story.descriptionBrand}
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {content.story.description3}
              </p>
            </motion.div>

            {/* Vision + Mission Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              className="space-y-6"
            >
              {/* Vision Card */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 text-xl">
                    ◇
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--text)]">{content.vision.title}</h2>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {content.vision.description}
                </p>
              </div>

              {/* Mission Card */}
              <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-500 text-xl">◆</span>
                  <h3 className="font-semibold text-[var(--text)] text-xl">{content.mission.title}</h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {content.mission.description}
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What We Stand For - Values Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-4">
              {lang === 'en' ? 'What We Stand For' : 'Tunachosimama'}
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              {lang === 'en' 
                ? 'Core values that guide every decision, design, and relationship.' 
                : 'Thamani za msingi zinazoongoza kila uamuzi, muundo, na uhusiano.'}
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {content.values.map((value, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.2 }}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:border-blue-500/30"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/20 flex items-center justify-center mb-4 text-blue-500 font-bold text-xl">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-[var(--text)] mb-2">{value.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Call to Action */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-8 md:p-12 text-center"
          >
            <div className="text-5xl mb-4">✦</div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-3">
              {content.cta.title}
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              {content.cta.desc}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              {content.cta.button}
              <span>✦</span>
            </Link>
          </motion.div>
        </section>
      </div>
      <Footer />
    </>
  );
}