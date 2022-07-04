import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import { useEffect, useState } from "react";

import Image from "next/image";

import Vulpera from "./Vulpera";

import { MainContext } from "./Contexts";
import Logo from "./Vulpera/Logo";

const Main = () => {
  const [progress, setProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [loadVisible, setLoadVisible] = useState(true);
  const [introText, setIntroText] = useState("");
  const [terminalReady, setTerminalReady] = useState(false);
  const [doIntro, setDoIntro] = useState(true);

  useEffect(() => {
    // Check if the user has chosen not to see the intro
    if (window.localStorage.getItem("doIntro") !== null) {
      console.log(window.localStorage.getItem("doIntro"));
      window.localStorage.getItem("doIntro") === "false"
        ? setDoIntro(false)
        : setDoIntro(true);
    }
  }, []);

  useEffect(() => {
    if (!doIntro) {
      setLoadVisible(false);
    }
  }, [doIntro]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgressValue(progressValue++);
      if (progressValue === 100) {
        clearInterval(interval);
      }
    }, 100);

    const load = () => {
      console.log("ay");
      clearInterval(interval);
      setProgressValue(100);

      if (
        window.localStorage.getItem("doIntro") === null ||
        window.localStorage.getItem("doIntro") === "true"
      ) {
        const introText = "Welcome, Oiku Perikato.";
        let timeScalar = 50;

        for (let i = 0; i < introText.length; i++) {
          console.log(i);
          setTimeout(() => {
            setIntroText(introText.substring(0, i + 1));
            if (i === introText.length - 1) {
              setTerminalReady(true);
              setTimeout(() => {
                setProgress(true);
              }, 2000);
            }
          }, i * timeScalar);
        }
      } else {
        setProgress(true);
      }
    };

    if (document.readyState === "complete") {
      load();
    } else {
      const docInterval = setInterval(() => {
        if (document.readyState === "complete") {
          console.log("we done!");
          load();
          clearInterval(docInterval);
        }
      }, 1);
      return () => clearInterval(interval);
    }
    // todo: logic for progress value
    return () => {
      clearInterval(interval);
    };
  }, [doIntro, progressValue]);

  useEffect(() => {
    if (progress) {
      const timeout = setTimeout(() => setLoadVisible(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  return (
    <>
      <MainContext.Provider
        value={{
          progress,
          setProgressValue,
          progressValue,
          terminalReady,
          setTerminalReady,
        }}>
        <div className="fixed w-screen h-screen bg-black"></div>
        {loadVisible && (
          <div
            style={{
              backgroundColor: "#161616" + (!progress ? "ff" : "00"),
              opacity: progress ? 0 : 1,
              transition: "all 1s",
            }}
            className="fixed w-screen h-screen">
            <CircularProgressbar
              background={false}
              value={progressValue}
              strokeWidth={6}
              styles={buildStyles({
                pathColor: `rgba(200,200,200,${progressValue / 100})`,
                textColor: "rgba(255, 255, 255, 0)",
                trailColor: "rgba(200,0,0,0)",
                backgroundColor: "rgba(0,0,0,0)",
                textSize: "20px",
                pathTransitionDuration: 1,
                strokeLinecap: "butt",
              })}
              className="w-80 h-80 top-0 fixed m-auto left-0 right-0 bottom-0"
            />
            <div
              style={{
                opacity: progressValue === 100 ? 1 : 0,
                transition: "opacity 0.5s",
              }}
              className="top-28 fixed m-auto left-0 right-0 bottom-0 w-32 h-80">
              <div className="w-32 h-32">
                <Logo />
              </div>
            </div>
            <div
              style={{ opacity: !progress ? 1 : 0 }}
              className="w-full h-full fixed text-center top-3/4 transition-opacity text-[rgb(212,212,216)] text-6xl font-['VT323']">
              <div
                style={{
                  opacity: progressValue === 100 ? 1 : 0,
                  transition: "0.5s opacity",
                }}>
                &gt; [ {introText} ]
              </div>
            </div>
          </div>
        )}
        <Vulpera />
      </MainContext.Provider>
    </>
  );
};

export default Main;
