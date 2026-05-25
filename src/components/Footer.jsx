import React, { useState, useEffect } from "react";
import contentData from "../content.json";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCodeFork, faStar } from "@fortawesome/free-solid-svg-icons";

/* ==========================================
*   JSON Template Example
*  ==========================================

  "footer": {
    "line_one": "Built & designed by",
    "copyright_line": "All rights reserved."
  },

  * "line_one": "First line in footer message"
  * "copyright_line": "Second line in footer message"
   
  NOTE: line_one will use the first, middle and last name declared in the general section of json file. If you dont have a middle name you can leave it as a blank ""

*/

async function fetchGitHubRepos(repoApiLink) {
  const response = await fetch(`${repoApiLink}/repos?per_page=100&sort=pushed`);

  if (!response.ok) {
    throw new Error("GitHub repositories could not be loaded.");
  }

  return response.json();
}

const Footer = () => {
  const showRepoStats = contentData.repo_stats.section.enable_section;
  const repoLink = contentData.repo_stats.repo_link;
  const repoApiLink = contentData.repo_stats.api_link;

  const iconStyle = {
    fontSize: "0.8rem", // Adjust the size as needed
    marginRight: "1.2rem", // Add space between icon and text
  };

  const [repoStats, setRepoStats] = useState({ forks: 0, stars: 0 });

  useEffect(() => {
    if (!showRepoStats) {
      return;
    }

    fetchGitHubRepos(repoApiLink)
      .then((repos) => {
        const publicRepos = repos.filter((repo) => !repo.fork && !repo.archived);

        setRepoStats({
          forks: publicRepos.reduce((total, repo) => total + repo.forks_count, 0),
          stars: publicRepos.reduce(
            (total, repo) => total + repo.stargazers_count,
            0,
          ),
        });
      })
      .catch((error) => {
        console.error("Error fetching GitHub footer stats:", error);
      });
  }, [repoApiLink, showRepoStats]);

  return (
    <footer>
      <div className="container">
        <div className="row">
          <div className="col-sm-12">
            <div className="copyright-box">
              <div className="credits">
                {contentData.footer.copyright_line} &copy;
              </div>
              {showRepoStats && (
                <div className="fork-stars">
                  <a href={repoLink}>
                    <span>
                      {repoStats.forks}{" "}
                      <FontAwesomeIcon icon={faCodeFork} style={iconStyle} />
                      {repoStats.stars}{" "}
                      <FontAwesomeIcon icon={faStar} style={iconStyle} />
                    </span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
