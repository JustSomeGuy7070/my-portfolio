import React, { useEffect, useMemo, useState } from "react";
import contentData from "../content.json";
import { FaGithub, FaDownload } from "react-icons/fa";
import { FiExternalLink, FiFolder } from "react-icons/fi";
import { Fade } from "react-awesome-reveal";

const getGitHubUsername = () => {
  const githubUrl = contentData.general.navbar_social_links.github;

  try {
    return new URL(githubUrl).pathname.split("/").filter(Boolean)[0];
  } catch {
    return "";
  }
};

const formatRepoDate = (dateValue) => {
  if (!dateValue) {
    return "Recently updated";
  }

  return `Updated ${new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue))}`;
};

const formatLanguages = (repo) => {
  const languageList = [repo.language, ...(repo.topics || [])].filter(Boolean);

  if (!languageList.length) {
    return "GitHub repository";
  }

  return languageList.slice(0, 4).join(", ");
};

const getReadableUrl = (url) =>
  url?.replace("YOUR_USERNAME", getGitHubUsername()).trim();

const isPublicDemoUrl = (url) => {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    return (
      !hostname.includes("localhost") &&
      hostname !== "127.0.0.1" &&
      !hostname.includes("shields.io") &&
      (hostname.includes("github.io") ||
        hostname.includes("render.com") ||
        hostname.includes("netlify.app") ||
        hostname.includes("vercel.app"))
    );
  } catch {
    return false;
  }
};

const getReadmeDemoUrl = (markdown) => {
  const liveDemoSection = markdown
    .split(/\r?\n/)
    .slice(
      Math.max(
        0,
        markdown
          .split(/\r?\n/)
          .findIndex((line) => /live demo|play live/i.test(line)),
      ),
    )
    .slice(0, 8)
    .join("\n");
  const urls = [
    ...liveDemoSection.matchAll(/https?:\/\/[^\s)]+/g),
    ...markdown.matchAll(/https?:\/\/[^\s)]+/g),
  ].map((match) => getReadableUrl(match[0]));

  return urls.find(isPublicDemoUrl) || "";
};

const fallbackProjects = contentData.projects.project_items || [];
const pinnedRepositories = contentData.projects.pinned_repositories || [];
const PROJECTS_CACHE_KEY = "portfolioGithubProjects";

const normalizeRepoName = (name = "") => name.toLowerCase();

const getPinnedRepoIndex = (repoName) =>
  pinnedRepositories.map(normalizeRepoName).indexOf(normalizeRepoName(repoName));

const isPinnedRepo = (repoName) =>
  !pinnedRepositories.length || getPinnedRepoIndex(repoName) !== -1;

const getCachedGitHubProjects = (githubUsername) => {
  if (typeof window === "undefined" || !githubUsername) {
    return null;
  }

  try {
    const cachedData = JSON.parse(localStorage.getItem(PROJECTS_CACHE_KEY));

    if (cachedData?.githubUsername === githubUsername) {
      return cachedData;
    }
  } catch {
    localStorage.removeItem(PROJECTS_CACHE_KEY);
  }

  return null;
};

const cacheGitHubProjects = (githubUsername, publicRepos, readmeDemoLinks) => {
  if (typeof window === "undefined" || !githubUsername) {
    return;
  }

  localStorage.setItem(
    PROJECTS_CACHE_KEY,
    JSON.stringify({
      githubUsername,
      readmeDemoLinks,
      repos: publicRepos,
    }),
  );
};

const getProjectLink = (project, icon) =>
  project.links.find((link) => link.icon === icon)?.href;

const getRepoNameFromGitHubUrl = (githubUrl) => {
  try {
    return new URL(githubUrl).pathname.split("/").filter(Boolean)[1] || "";
  } catch {
    return "";
  }
};

const getProjectLiveUrl = (project) =>
  getReadableUrl(project.live_url) ||
  getReadableUrl(getProjectLink(project, "FiExternalLink"));

const getFallbackProjectByRepo = (repoUrl) =>
  fallbackProjects.find(
    (project) =>
      getProjectLink(project, "FaGithub")?.toLowerCase() ===
      repoUrl?.toLowerCase(),
  );

const getFallbackProjectByRepoName = (repoName) =>
  fallbackProjects.find(
    (project) =>
      normalizeRepoName(getRepoNameFromGitHubUrl(getProjectLink(project, "FaGithub"))) ===
      normalizeRepoName(repoName),
  );

const getRawReadmeUrls = (githubUrl) => {
  if (!githubUrl) {
    return [];
  }

  try {
    const repoPath = new URL(githubUrl).pathname.split("/").filter(Boolean);
    const [owner, repo] = repoPath;

    if (!owner || !repo) {
      return [];
    }

    return ["main", "master"].map(
      (branch) =>
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`,
    );
  } catch {
    return [];
  }
};

const fetchFirstAvailableReadme = (readmeUrls, signal) =>
  readmeUrls.reduce(
    (request, readmeUrl) =>
      request.catch(() =>
        fetch(readmeUrl, { signal }).then((readmeResponse) => {
          if (!readmeResponse.ok) {
            throw new Error("README could not be loaded.");
          }

          return readmeResponse.text();
        }),
      ),
    Promise.reject(),
  );

const fetchFallbackDemoLinkEntries = (signal) =>
  Promise.all(
    fallbackProjects.map((project) => {
      const githubUrl = getProjectLink(project, "FaGithub");
      const readmeUrls = getRawReadmeUrls(githubUrl);

      return fetchFirstAvailableReadme(readmeUrls, signal)
        .then((markdown) => [githubUrl, getReadmeDemoUrl(markdown)])
        .catch(() => [githubUrl, ""]);
    }),
  );

const fetchRepoDemoLinkEntries = (repos, signal) =>
  Promise.all(
    repos.map((repo) =>
      fetch(
        `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/README.md`,
        { signal },
      )
        .then((readmeResponse) =>
          readmeResponse.ok ? readmeResponse.text() : "",
        )
        .then((markdown) => [repo.full_name, getReadmeDemoUrl(markdown)])
        .catch(() => [repo.full_name, ""]),
    ),
  );

const getPublicRepos = (repos) =>
  repos
    .filter((repo) => !repo.fork && !repo.archived && isPinnedRepo(repo.name))
    .sort((a, b) => {
      const pinnedOrderDifference =
        getPinnedRepoIndex(a.name) - getPinnedRepoIndex(b.name);

      return pinnedRepositories.length
        ? pinnedOrderDifference
        : new Date(b.pushed_at) - new Date(a.pushed_at);
    });

const Projects = () => {
  const githubUsername = useMemo(() => getGitHubUsername(), []);
  const cachedGitHubProjects = useMemo(
    () => getCachedGitHubProjects(githubUsername),
    [githubUsername],
  );
  const [repos, setRepos] = useState(cachedGitHubProjects?.repos || []);
  const [readmeDemoLinks, setReadmeDemoLinks] = useState(
    cachedGitHubProjects?.readmeDemoLinks || {},
  );
  const [loading, setLoading] = useState(
    Boolean(githubUsername && !cachedGitHubProjects),
  );
  const [error, setError] = useState(
    githubUsername ? "" : "GitHub profile link is missing.",
  );

  useEffect(() => {
    if (!githubUsername) {
      return;
    }

    const controller = new AbortController();
    const reposUrl = `https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=pushed`;

    fetch(reposUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("GitHub repositories could not be loaded.");
        }

        return response.json();
      })
      .then((repoData) => {
        const publicRepos = getPublicRepos(repoData);

        setError("");

        return Promise.all([
          fetchRepoDemoLinkEntries(publicRepos, controller.signal),
          fetchFallbackDemoLinkEntries(controller.signal),
        ]).then(([repoDemoLinkEntries, fallbackDemoLinkEntries]) => ({
          fallbackDemoLinkEntries,
          publicRepos,
          repoDemoLinkEntries,
        }));
      })
      .then(({ fallbackDemoLinkEntries, publicRepos, repoDemoLinkEntries }) => {
        const nextReadmeDemoLinks = Object.fromEntries([
          ...repoDemoLinkEntries,
          ...fallbackDemoLinkEntries,
        ]);

        setReadmeDemoLinks(nextReadmeDemoLinks);
        setRepos(publicRepos);
        cacheGitHubProjects(githubUsername, publicRepos, nextReadmeDemoLinks);
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          console.error("Error fetching GitHub repositories:", fetchError);
          setError("Unable to load GitHub repositories right now.");
        }

        return fetchFallbackDemoLinkEntries(controller.signal).then(
          (fallbackDemoLinkEntries) =>
            setReadmeDemoLinks(Object.fromEntries(fallbackDemoLinkEntries)),
        );
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [cachedGitHubProjects, githubUsername]);

  const displayedRepos = repos.length ? getPublicRepos(repos) : [];
  const displayedFallbackProjects = fallbackProjects.filter((project) =>
    isPinnedRepo(getRepoNameFromGitHubUrl(getProjectLink(project, "FaGithub"))),
  );

  const projects = pinnedRepositories.length
    ? pinnedRepositories
        .map((repoName) => {
          const repo = displayedRepos.find(
            (currentRepo) =>
              normalizeRepoName(currentRepo.name) === normalizeRepoName(repoName),
          );
          const fallbackProject = getFallbackProjectByRepoName(repoName);
          const githubUrl =
            repo?.html_url || getProjectLink(fallbackProject, "FaGithub");
          const defaultBranch = repo?.default_branch || "main";

          if (!repo && !fallbackProject) {
            return null;
          }

          return {
            name: repo?.name || fallbackProject.project_name,
            description:
              repo?.description ||
              fallbackProject?.description ||
              "No description provided yet.",
            resources: repo
              ? formatLanguages(repo)
              : fallbackProject.resources_used.join(", "),
            updated: repo
              ? formatRepoDate(repo.pushed_at)
              : `${fallbackProject.start_date} - ${fallbackProject.end_date}`,
            homepage:
              getReadableUrl(repo?.homepage) ||
              readmeDemoLinks[repo?.full_name] ||
              readmeDemoLinks[githubUrl] ||
              getProjectLiveUrl(fallbackProject || {}),
            githubUrl,
            downloadUrl:
              repo?.full_name && defaultBranch
                ? `https://github.com/${repo.full_name}/archive/refs/heads/${defaultBranch}.zip`
                : getProjectLink(fallbackProject, "FaDownload"),
          };
        })
        .filter(Boolean)
    : displayedRepos.length
      ? displayedRepos.map((repo) => ({
        fallbackProject: getFallbackProjectByRepo(repo.html_url),
        name: repo.name,
        description: repo.description || "No description provided yet.",
        resources: formatLanguages(repo),
        updated: formatRepoDate(repo.pushed_at),
        homepage:
          getReadableUrl(repo.homepage) ||
          readmeDemoLinks[repo.full_name] ||
          readmeDemoLinks[repo.html_url] ||
          getProjectLiveUrl(getFallbackProjectByRepo(repo.html_url) || {}),
        githubUrl: repo.html_url,
        downloadUrl: `https://github.com/${repo.full_name}/archive/refs/heads/${repo.default_branch}.zip`,
      }))
      : displayedFallbackProjects.map((project) => ({
        name: project.project_name,
        description: project.description,
        resources: project.resources_used.join(", "),
        updated: `${project.start_date} - ${project.end_date}`,
        homepage:
          getProjectLiveUrl(project) ||
          readmeDemoLinks[getProjectLink(project, "FaGithub")],
        githubUrl: getProjectLink(project, "FaGithub"),
        downloadUrl: getProjectLink(project, "FaDownload"),
      }));
  const projectRowCount = Math.ceil(
    Math.max(projects.length, displayedFallbackProjects.length, 1) / 3,
  );
  const projectCardCount = Math.max(
    projects.length,
    displayedFallbackProjects.length,
    1,
  );

  return (
    <section id="recentprojects" className="recentprojects-mf sect-pt4 route">
      <div className="container">
        <div className="row">
          <div className="col-sm-12">
            <Fade triggerOnce={true}>
              <div className="title-box text-center">
                <h3 className="title-a" id="projects">
                  {contentData.projects.section.title}
                  <div className="line-mf"></div>
                </h3>
                <p className="subtitle-a">
                  {contentData.projects.section.description}
                </p>
              </div>
            </Fade>
          </div>
        </div>

        <div className="projects-status" aria-live="polite">
          {loading && <p>Loading GitHub repositories...</p>}

          {!loading && error && !projects.length && <p>{error}</p>}

          {!loading && !error && !projects.length && (
            <p>No public repositories found for {githubUsername}.</p>
          )}
        </div>

        <div className="col-sm-12">
          <div
            className="row projects-grid"
            style={{
              "--project-card-count": projectCardCount,
              "--project-row-count": projectRowCount,
            }}
          >
            {projects.map((project, index) => (
              <div className="col-md-4" key={project.githubUrl || project.name}>
                <Fade
                  delay={index * 120}
                  direction="up"
                  cascade={false}
                  triggerOnce={true}
                >
                  <div className="card card-recentprojects">
                    <div className="card-body">
                      <div className="card-category-box"></div>
                      <div>
                        <h1 className="folder-icon">
                          <FiFolder />
                        </h1>
                      </div>
                      <h3 className="card-title">
                        {project.homepage ? (
                          <a
                            href={project.homepage}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {project.name}
                          </a>
                        ) : (
                          project.name
                        )}
                      </h3>
                      <p className="card-description">
                        {project.description}
                      </p>
                      <br />
                      <p className="resources-used">{project.resources}</p>
                    </div>
                    <div className="card-footer">
                      <div className="post-author">
                        <span className="author">{project.updated}</span>
                      </div>
                      <div className="post-date">
                        {project.homepage && (
                          <a
                            href={project.homepage}
                            target="_blank"
                            rel="noreferrer"
                            data-tooltip="View Live Project"
                          >
                            <FiExternalLink />
                          </a>
                        )}
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            data-tooltip="Visit GitHub Repo"
                          >
                            <FaGithub />
                          </a>
                        )}
                        {project.downloadUrl && (
                          <a
                            href={project.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            data-tooltip="Download Project"
                          >
                            <FaDownload />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Fade>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
