import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

const projects = [
  { category: "Web system", title: "LJN OBDRAS", description: "Online barangay document requests and appointment booking for residents.", image: "/ljnObdras.jpg", tags: [{ name: "PHP", icon: "fa-brands fa-php" }, { name: "MySQL", icon: "fa-solid fa-database" }] },
  { category: "Java application", title: "RoomEase", description: "A room booking system for dorms and hotels, with reservations stored in JSON.", image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=85", tags: [{ name: "Java", icon: "fa-brands fa-java" }, { name: "JSON", icon: "fa-solid fa-file-code" }] },
  { category: "AI experiment", title: "HandPiano", description: "Hand signs detected through the webcam become piano notes in real time.", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=85", tags: [{ name: "MediaPipe", icon: "fa-solid fa-hand" }, { name: "JavaScript", icon: "fa-brands fa-js" }] },
  { category: "Desktop application", title: "POS System", description: "A Java Swing application for handling sales and everyday transactions.", image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=85", tags: [{ name: "Java", icon: "fa-brands fa-java" }, { name: "Swing", icon: "fa-solid fa-window-maximize" }] },
  { category: "Computer vision", title: "Makeup Suggestion", description: "Skin tone analysis paired with makeup shade suggestions from a trained model.", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=85", tags: [{ name: "Teachable Machine", icon: "fa-solid fa-brain" }, { name: "HTML", icon: "fa-brands fa-html5" }] },
  { category: "Online storefront", title: "Bloom Boutique", description: "A flower shop experience where customers browse, cart, and order bouquets.", image: "/bloomBoutique.jpg", tags: [{ name: "React.js", icon: "fa-brands fa-react" }, { name: "UI design", icon: "fa-solid fa-palette" }] },
];

export function ProjectCarousel() {
  return (
    <div className="project-react-showcase">
      <div className="projects-heading">
        <div><p className="eyebrow">Projects I've made</p><h2>Projects with a purpose.</h2></div>
        <p>Class and personal builds, from web apps to desktop systems and playful AI experiments.</p>
      </div>
      <Carousel opts={{ dragFree: true }} className="project-react-carousel">
        <CarouselContent className="project-react-content">
          {projects.map((project, index) => (
            <CarouselItem key={project.title} className="project-react-item">
              <article className="project-react-card">
                <img src={project.image} alt={project.title} />
                <div className="project-react-overlay" />
                <div className="project-react-info">
                  <p className="project-category">{project.category}</p>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <ul className="tags">{project.tags.map((tag) => <li key={tag.name}><i className={`project-tech-icon ${tag.icon}`} aria-hidden="true" />{tag.name}</li>)}</ul>
                </div>
                <span className="project-number">{String(index + 1).padStart(2, "0")}</span>
                <Button size="icon" variant="outline" className="project-react-link" aria-label={`Open ${project.title}`}><ArrowUpRight /></Button>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="project-react-controls">
          <span>Browse projects</span>
          <CarouselPrevious aria-label="Previous project"><ChevronLeft /></CarouselPrevious>
          <CarouselNext aria-label="Next project"><ChevronRight /></CarouselNext>
        </div>
      </Carousel>
    </div>
  );
}
