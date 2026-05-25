import React, { useEffect, useState } from "react";
import contentData from "../content.json";
import { Fade } from "react-awesome-reveal";

const getGithubUsername = () => {
  try {
    return new URL(contentData.repo_stats.repo_link).pathname
      .split("/")
      .filter(Boolean)[0];
  } catch {
    return "";
  }
};

const formatLastPush = (dateValue) => {
  if (!dateValue) {
    return "No public pushes yet";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
};

const RepoStats = () => {
  const [githubData, setGithubData] = useState({
    profile: null,
    repos: [],
    latestRepo: null,
    stars: 0,
  });
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const githubUsername = getGithubUsername();
    const profileUrl =
      contentData.repo_stats.api_link ||
      `https://api.github.com/users/${githubUsername}`;
    const reposUrl = `${profileUrl}/repos?per_page=100&sort=pushed`;

    const handleScroll = () => {
      setHidden(window.scrollY > 100);
    };

    Promise.all([
      fetch(profileUrl, { signal: controller.signal }),
      fetch(reposUrl, { signal: controller.signal }),
    ])
      .then(([profileResponse, reposResponse]) => {
        if (!profileResponse.ok || !reposResponse.ok) {
          throw new Error("GitHub account data could not be loaded.");
        }

        return Promise.all([profileResponse.json(), reposResponse.json()]);
      })
      .then(([profile, repos]) => {
        const publicRepos = repos.filter((repo) => !repo.fork && !repo.archived);
        const latestRepo = [...publicRepos].sort(
          (a, b) => new Date(b.pushed_at) - new Date(a.pushed_at),
        )[0];

        setGithubData({
          profile,
          repos: publicRepos,
          latestRepo,
          stars: publicRepos.reduce(
            (total, repo) => total + repo.stargazers_count,
            0,
          ),
        });
        setError("");
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          console.error("Error fetching GitHub account data:", fetchError);
          setError("GitHub stats unavailable");
        }
      });

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      controller.abort();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const { profile, repos, latestRepo, stars } = githubData;
  const githubName = profile?.login || getGithubUsername() || "GitHub";
  const repoLink = latestRepo?.html_url || contentData.repo_stats.repo_link;

  return (
    <div className={`repo-stats ${hidden ? "hidden" : ""}`}>
      <Fade direction="down" triggerOnce={true}>
        <p>
          <a href={contentData.repo_stats.repo_link} target="_blank" rel="noreferrer">
            GitHub: {githubName}
          </a>{" "}
          &bull;{" "}
          <a href={`${contentData.repo_stats.repo_link}?tab=repositories`} target="_blank" rel="noreferrer">
            Public Repos: {profile?.public_repos ?? repos.length}
          </a>{" "}
          &bull;{" "}
          <a href={`${contentData.repo_stats.repo_link}?tab=repositories`} target="_blank" rel="noreferrer">
            Stars: {stars}
          </a>{" "}
          &bull;{" "}
          <a href={repoLink} target="_blank" rel="noreferrer">
            Last Push: {error || formatLastPush(latestRepo?.pushed_at)}
          </a>
        </p>
      </Fade>
    </div>
  );
};

export default RepoStats;
