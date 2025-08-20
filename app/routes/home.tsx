import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
// Make sure to import 'resumes' from the correct path where it is exported.
// For example, if it's in a local file 'app/constants.ts', use:
import { resumes } from "../../constants/index";
// Or update the path as needed to match your project structure.
import type { ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";
import ResumeCard from "~/components/ResumeCard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your resume" },
  ];
}

export default function Home() {
  return (
    <main className= "bg-[url('/images/bg-main.svg')]">
      <Navbar />
      <section className="main-section">
        <div className="page-heading">
          <h1> Track your resume and applications with Resumind</h1>
          <h2> Review your submitted resumes</h2>
        </div>

        {
          resumes.length > 0 && (
            <div className="resumes-section">
              {resumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
              ))}
            </div>
          )
        }
      </section>
      
    </main>
  );
}
