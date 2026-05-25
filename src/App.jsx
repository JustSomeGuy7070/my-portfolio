import React, { Suspense, lazy } from "react";
import Navbar from "./components/Navbar";
import Linkbar from "./components/Linkbar";
import Intro from "./components/Intro";
import About from "./components/About";
import Education from "./components/Education";
import WorkExperience from "./components/WorkExperience";
import Footer from "./components/Footer";
import Error404 from "./components/Error404";
import StarryBackground from "./components/StarryBackground";

import { BrowserRouter as Router, Route, Routes } from "react-router";

import "./App.css";
import content from "./content.json";

const Projects = lazy(() => import("./components/Projects"));
const RepoStats = lazy(() => import("./components/RepoStats"));
const ResumePage = lazy(() => import("./components/Resume"));

// Note that the section.enable_section has to equal true in
// order for that specific component to load in the app.js

function App() {
  const { intro_screen, about_me, academics, experience, projects, repo_stats } =
    content;

  return (
    <Router>
      <StarryBackground />
      <div className="app-content">
        <Suspense fallback={null}>
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <Navbar />
                  {repo_stats.section.enable_section && <RepoStats />}
                  <Linkbar />
                  {intro_screen.section.enable_section && <Intro />}
                  {about_me.section.enable_section && <About />}
                  {academics.section.enable_section && <Education />}
                  {experience.section.enable_section && <WorkExperience />}
                  {projects.section.enable_section && <Projects />}
                  <Footer />
                </div>
              }
            ></Route>
            <Route path="/resume" element={<ResumePage />} />
            <Route path="*" element={<Error404 />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
