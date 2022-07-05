import { useRef, useEffect, useContext, useState } from "react";

import { useSpring, animated as a } from "react-spring";

import { MainContext, VulperaContext } from "../Contexts";

import "xterm/css/xterm.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAmazon } from "@fortawesome/free-brands-svg-icons";
import Logo from "./Logo";

const TerminalComponent = () => {
  const mainContext = useContext(MainContext);
  const vulperaContext = useContext(VulperaContext);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalSize, setTerminalSize] = useState({ width: 0, height: 0 });
  const [terminal, setTerminal] = useState(null);
  const terminalRef = useRef();
  const parentTerminalRef = useRef();
  const blurRef = useRef();
  const scrollRef = useRef();

  // prevent terminal from duplicating on re-render
  useEffect(() => {
    if (terminal) {
      terminal.dispose();
      setTerminal(null);
    }
  }, []);

  const callTerminal = async () => {
    const T = await import("../../js/terminal");
    T.assembleTerminal({
      terminalRef,
      setTerminalSize,
      mainContext,
      setTerminalOpen,
      setTerminal,
      vulperaContext,
      parentTerminalRef,
    }).then((terminal) => {
      console.log(terminal);
    });
  };

  useEffect(() => {
    if (mainContext.terminalReady) {
      callTerminal();
    }
  }, [mainContext.terminalReady]);

  return (
    <>
      <a.div
        ref={parentTerminalRef}
        style={vulperaContext.terminalSpring}
        className="px-4 py-4 backdrop-blur-xl rounded-2xl bg-[#1E1E1E80] top-[4.2rem] right-0 left-0 m-auto w-[70%] h-[50%] fixed border-2 border-zinc-700">
        <div className="h-0 w-8 right-0 absolute -z-10 mx-6">
          <Logo fill="rgb(217,198,129)" />
        </div>
        <div
          ref={terminalRef}
          className="font-['Roboto_Mono'] w-full h-full relative"></div>
      </a.div>
    </>
  );
};

export default TerminalComponent;
