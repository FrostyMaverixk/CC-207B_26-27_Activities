import { createRoot } from "react-dom/client";

import { ProjectCarousel } from "@/components/project-carousel";
import { TextAnimate } from "@/components/ui/text-animate";
import { ServiceCarousel } from "@/components/ui/services-card";
import "./index.css";

const mount = document.getElementById("projects-react-root");
const skillsTitle = document.getElementById("skills-title-root");
const servicesMount = document.getElementById("services-react-root");

if (mount) {
  createRoot(mount).render(<ProjectCarousel />);
}

if (skillsTitle) {
  createRoot(skillsTitle).render(
    <TextAnimate duration={2}>
      I ship beautiful interfaces fast
    </TextAnimate>,
  );
}

if (servicesMount) {
  createRoot(servicesMount).render(<ServiceCarousel />);
}
