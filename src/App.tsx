import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import IntroVideoMp4 from "./components/IntroVideoMp4";
import Section from "./components/Section";
import ProjectGrid from "./components/ProjectGrid";
import Timeline from "./components/Timeline";
import Skills from "./components/Skills";
import Education from "./components/Education";
import Publications from "./components/Publications";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import CommandPalette from "./components/CommandPalette";
import ScrollProgress from "./components/ScrollProgress";
import { Icons } from "./components/Icons";

export default function App() {
  const [cmdk, setCmdk] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && isK) {
        e.preventDefault();
        setCmdk(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div>
      <ScrollProgress />
      <Navbar onOpenCmdk={() => setCmdk(true)} />

      <main>
        <Hero onOpenCmdk={() => setCmdk(true)} />

        {/* ✅ Intro video section (right after Hero, before Projects) */}
        <IntroVideoMp4 />

        <Section
          id="projects"
          title="Projects"
          icon={<Icons.Cpu className="h-5 w-5" />}
        >
          <ProjectGrid />
        </Section>

        <Section
          id="experience"
          title="Experience"
          subtitle="What I shipped, improved, and measured."
          icon={<Icons.Briefcase className="h-5 w-5" />}
        >
          <Timeline />
        </Section>

        <Section
          id="skills"
          title="Skills"
          icon={<Icons.Sparkles className="h-5 w-5" />}
        >
          <Skills />
        </Section>

        <Section
          id="education"
          title="Education"
          icon={<Icons.GraduationCap className="h-5 w-5" />}
        >
          <Education />
        </Section>

        <Section
          id="publications"
          title="Publications"
          subtitle="Research"
          icon={<Icons.BookOpenText className="h-5 w-5" />}
        >
          <Publications />
        </Section>

        <Section
          id="contact"
          title="Contact"
          subtitle="Reach out for Summer 2026 opportunities, projects, or collaboration."
          icon={<Icons.Mail className="h-5 w-5" />}
        >
          <Contact />
        </Section>
      </main>

      <Footer />

      <CommandPalette open={cmdk} onClose={() => setCmdk(false)} />
    </div>
  );
}
