import Video from "./Video";
import Terminal from "./Terminal";
import { useSpring, animated as a } from "react-spring";

import { useContext, useEffect, useState } from "react";

import { MainContext } from "../Contexts";

import { VulperaContext } from "../Contexts";

import { updateSpring } from "../../js/utils";

const Vulpera = () => {
  const mainContext = useContext(MainContext);

  const [videoState, setVideoState] = useState({ opacity: 0, scale: 0.8 });

  const [videoSpring, videoSpringApi] = useSpring(() => ({
    config: {
      mass: 1,
      tension: 200,
      friction: 20,
    },
    ...videoState,
    x: 0,
    y: 0,
  }));

  const [contentSpring, contentSpringApi] = useSpring(() => ({
    opacity: 1,
  }));

  const [terminalSpring, terminalSpringApi] = useSpring(() => ({
    opacity: 0,
  }));

  const vsa = videoSpringApi;
  const cs = contentSpringApi;
  const tsa = terminalSpringApi;

  useEffect(() => {
    updateSpring(vsa, videoState);
  }, [videoState]);

  useEffect(() => {
    if (mainContext.progress) {
      setVideoState({ opacity: 1, scale: 1.1 });
      updateSpring(tsa, {
        opacity: 1,
        onRest: () => {
          mainContext.setTerminalReady(true);
        },
      });
    }
  }, [mainContext.progress]);

  const mouseHandler = (e) => {
    if (mainContext.progress) {
      switch (e.type) {
        case "mouseenter":
          updateSpring(vsa, { ...videoState, scale: 1.1 });
          break;
        case "mouseleave":
          updateSpring(vsa, { ...videoState, scale: 1, x: 0, y: 0 });
          break;
        case "mousemove":
          updateSpring(vsa, {
            config: {
              tension: 500,
              friction: 25,
            },
            x: -e.clientX * 0.02,
            y: -e.clientY * 0.02,
          });
          break;
        default:
          break;
      }
    }
  };
  return (
    <>
      <VulperaContext.Provider
        value={{
          setVideoState,
          terminalSpring,
          terminalSpringApi,
        }}>
        <div
          onMouseEnter={mouseHandler}
          onMouseLeave={mouseHandler}
          onMouseMove={mouseHandler}>
          <a.div style={videoSpring} className="w-full h-screen fixed">
            <div
              className="fixed w-screen h-screen z-50"
              style={{ boxShadow: `inset 0 0 250px #000000` }}></div>
            <Video />
          </a.div>
          <a.div style={contentSpring}>
            <Terminal />
          </a.div>
        </div>
      </VulperaContext.Provider>
    </>
  );
};

export default Vulpera;
