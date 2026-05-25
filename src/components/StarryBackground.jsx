import React, { useEffect } from "react";

const twinkleStars = [
  { top: "8%", left: "12%", size: 2, delay: "0s", duration: "3.8s" },
  { top: "14%", left: "34%", size: 1, delay: "1.1s", duration: "4.5s" },
  { top: "18%", left: "68%", size: 2, delay: "2.2s", duration: "5.1s" },
  { top: "25%", left: "86%", size: 1, delay: "0.6s", duration: "3.4s" },
  { top: "33%", left: "22%", size: 1, delay: "1.8s", duration: "4.8s" },
  { top: "39%", left: "51%", size: 2, delay: "3.1s", duration: "5.6s" },
  { top: "48%", left: "77%", size: 1, delay: "0.9s", duration: "4.2s" },
  { top: "58%", left: "16%", size: 2, delay: "2.7s", duration: "5.3s" },
  { top: "66%", left: "42%", size: 1, delay: "1.4s", duration: "3.9s" },
  { top: "74%", left: "93%", size: 2, delay: "3.7s", duration: "5.8s" },
  { top: "82%", left: "29%", size: 1, delay: "0.3s", duration: "4.6s" },
  { top: "91%", left: "61%", size: 2, delay: "2.4s", duration: "5s" },
];

const shootingStars = [
  { top: "14%", left: "72%", delay: "1.5s", duration: "8.5s" },
  { top: "38%", left: "88%", delay: "5.8s", duration: "10s" },
  { top: "62%", left: "64%", delay: "11.2s", duration: "9.5s" },
];

function StarryBackground() {
  useEffect(() => {
    let frameId = 0;

    const updateScrollPosition = () => {
      const parallaxOffset = window.scrollY * -0.12;

      document.documentElement.style.setProperty(
        "--star-parallax",
        `${parallaxOffset}px`
      );
      document.documentElement.style.setProperty(
        "--star-parallax-far",
        `${parallaxOffset * 0.55}px`
      );
      frameId = 0;
    };

    const handleScroll = () => {
      if (frameId === 0) {
        frameId = window.requestAnimationFrame(updateScrollPosition);
      }
    };

    updateScrollPosition();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div className="starry-background" aria-hidden="true">
      <div className="starry-background__sky" />
      <div className="starry-background__stars starry-background__stars--near" />
      <div className="starry-background__stars starry-background__stars--far" />
      <div className="starry-background__twinkles">
        {twinkleStars.map((star, index) => (
          <span
            className="starry-background__twinkle"
            key={`twinkle-${index}`}
            style={{
              "--star-top": star.top,
              "--star-left": star.left,
              "--star-size": `${star.size}px`,
              "--star-delay": star.delay,
              "--star-duration": star.duration,
            }}
          />
        ))}
      </div>
      <div className="starry-background__shooting-stars">
        {shootingStars.map((star, index) => (
          <span
            className="starry-background__shooting-star"
            key={`shooting-star-${index}`}
            style={{
              "--shooting-top": star.top,
              "--shooting-left": star.left,
              "--shooting-delay": star.delay,
              "--shooting-duration": star.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default StarryBackground;
