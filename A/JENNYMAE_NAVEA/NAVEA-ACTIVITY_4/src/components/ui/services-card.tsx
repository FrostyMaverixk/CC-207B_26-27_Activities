import * as React from "react";
import { motion, useInView } from "framer-motion";
import { Code2, Palette, Search, Workflow } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
} from "@/components/ui/carousel";

export interface Service {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}

const services: Service[] = [
  {
    title: "Design and prototyping",
    description: "Clear, friendly screens shaped through Figma, Canva, and thoughtful visual hierarchy.",
    icon: Palette,
    gradient: "service-gradient-pink",
  },
  {
    title: "AI and computer vision",
    description: "Practical experiments with Teachable Machine and MediaPipe that make interfaces memorable.",
    icon: Search,
    gradient: "service-gradient-peach",
  },
  {
    title: "Development environments",
    description: "Comfortable moving between browser work, Java applications, databases, and structured code.",
    icon: Code2,
    gradient: "service-gradient-blue",
  },
  {
    title: "IT project management",
    description: "Focused planning with Gantt charts, UML diagrams, and documentation that keeps work on track.",
    icon: Workflow,
    gradient: "service-gradient-green",
  },
];

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const Icon = service.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className={`service-card ${service.gradient}`}
    >
      <div className="service-card-icon"><Icon aria-hidden="true" /></div>
      <div className="service-card-content">
        <h3>{service.title}</h3>
        <p>{service.description}</p>
      </div>
      <div className="service-card-glow" aria-hidden="true" />
    </motion.article>
  );
}

export function ServiceCarousel() {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className="service-carousel">
      <Carousel opts={{ align: "start", loop: true }} className="service-carousel-inner">
        <motion.div initial="hidden" animate={isInView ? "visible" : "hidden"}>
          <CarouselContent className="service-carousel-content">
            {services.map((service, index) => (
              <CarouselItem key={service.title} className="service-carousel-item">
                <ServiceCard service={service} index={index} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </motion.div>
        <CarouselNext className="service-carousel-next" aria-label="Next skill" />
      </Carousel>
    </div>
  );
}
