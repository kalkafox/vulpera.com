import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebglAddon } from "xterm-addon-webgl";
import ansiEscapes from "ansi-escapes";
import { updateSpring } from "./utils";

import { io } from "socket.io-client";

const cliSpinners = require("cli-spinners");
const c = require("ansi-colors");
const parsePath = require("parse-path");
const fitAddon = new FitAddon();

let currentStates = {};

let command = "";

let currentFingerprint = "";

let user = "oiku";

const getUser = () => {
  return user;
};

const color1 = c.yellow;
const color2 = c.yellowBright;

let intro = [
  `                       ${color1(
    ",, gp       ,,"
  )}                                               `,
  `  ${color1(
    "`7MMF'   `7MF'     `7MM \\/     `7MM"
  )}                          ${color2('.g8""8q.    .M"""bgd')} `,
  `    ${color1(
    "`MA     ,V         MM `'       MM"
  )}                        ${color2(`.dP'    \`YM. ,MI    "Y`)} `,
  `     ${color1(
    'VM:   ,V ,pW"Wq.  MM     ,M""bMM `7MM  `7MM  `7MMpMMMb.'
  )} ${color2("dM'      `MM `MMb.")}     `,
  `      ${color1(
    "MM.  M'6W'   `Wb MM   ,AP    MM   MM    MM    MM    MM"
  )} ${color2("MM        MM   `YMMNq.")} `,
  `      ${color1(
    "`MM A' 8M     M8 MM   8MI    MM   MM    MM    MM    MM"
  )} ${color2("MM.      ,MP .     `MM")} `,
  `       ${color1(
    ":MM;  YA.   ,A9 MM   `Mb    MM   MM    MM    MM    MM"
  )} ${color2("`Mb.    ,dP' Mb     dM")} `,
  `        ${color1(
    'VF    `Ybmd9\'.JMML.  `Wbmd"MML. `Mbod"YML..JMML  JMML.'
  )} ${color2(`\`"bmmd"'   P"Ybmmd"`)}  `,
];

const motd = (term, version) => {
  term.writeln(
    [
      `${intro.join("\r\n")}\r\n\t Version: ${c.green(version)} `,
      `\r\nNew and ${c.italic("improved")}™ with React and React Spring.\r\n`,
    ].join("\r\n")
  );
};

let history = [];

let historyIndex = 0;

let session = {
  logs: [],
  id: 0,
  active: false,
};

let sessions = [];

let prompt_dispose = null;

const commands = {
  clear: {
    description: "Clear the terminal",
    action: (term) => {
      term.reset();
      TermApp.prompt(term);
    },
  },
  help: {
    description: "Show help",
    action: (term) => {
      for (let command in commands) {
        term.writeln(
          `${c.cyan(command)}${c.cyanBright(
            `\t\t...........${commands[command].description}`
          )}`
        );
      }
      term.writeln("");
      TermApp.prompt(term);
    },
  },
  purge: {
    description: "Purge the terminal history (Warning: this cannot be undone)",
    action: (term) => {
      window.localStorage.removeItem("history");
      history = [];
      historyIndex = 0;
      term.writeln("History purged");
      TermApp.prompt(term);
    },
  },
  history: {
    description: "Show the terminal history",
    action: (term) => {
      for (let i = 0; i < history.length; i++) {
        term.writeln(`${i}\t......${history[i]}`);
      }
      term.writeln("");
      TermApp.prompt(term);
    },
  },
  ping: {
    description: "Ping the server",
    action: async (term, params = []) => {
      const time = new Date().getTime();
      if (params.length === 0) {
        const res = await fetch("/api/ping");
        if (res.ok) {
          const data = await res.json();
          term.writeln(`Pong! ${new Date().getTime() - time}ms`);
        } else {
          term.writeln(
            `Pong! (but the server is not responding... Got response: ${res.status} ${res.statusText})`
          );
        }
        TermApp.prompt(term);
      }
    },
  },
  intro: {
    description: "Toggle the introduction on next page reload",
    action: (term) => {
      const doIntro = window.localStorage.getItem("doIntro");
      if (doIntro === "true") {
        window.localStorage.setItem("doIntro", "false");
        term.writeln("Introduction disabled");
      } else {
        window.localStorage.setItem("doIntro", "true");
        term.writeln("Introduction enabled");
      }
      TermApp.prompt(term);
    },
  },
  test: {
    description: "Test command",
    action: (term, params = []) => {
      let messages = [
        "Reticulating splines...",
        "Calculating...",
        "Doing too much work...",
      ];
      let message = messages[Math.floor(Math.random() * messages.length)];
      prompt_dispose.dispose();
      term.writeln(`Test command: ${params.join(" ")}`);
      term.writeln("Running...");
      let frame = 0;
      term.write(ansiEscapes.cursorHide);

      const changeTextInterval = setInterval(() => {
        message = messages[Math.floor(Math.random() * messages.length)];
      }, 3000);

      const interval = setInterval(() => {
        if (frame === cliSpinners.dots.frames.length) {
          frame = 0;
        }
        term.write(ansiEscapes.cursorLeft);
        term.write(ansiEscapes.eraseEndLine);
        term.write(cliSpinners.dots.frames[frame]);
        term.write(` ${message}`);
        frame++;
      }, cliSpinners.dots.interval);

      const prompt = term.onData((e) => {
        switch (e) {
          // case Ctrl+Q
          case "\x11":
            term.writeln("\r\nForce quitting");
            clearInterval(interval);
            clearInterval(changeTextInterval);
            prompt.dispose();
            TermApp.onData(mainPrompt, term);
            TermApp.prompt(term);
            term.write(ansiEscapes.cursorShow);

          case "\u0003": // Ctrl+C
            clearInterval(interval);
            clearInterval(changeTextInterval);
            term.writeln("\r\nQuitting!");
            prompt.dispose();
            TermApp.onData(mainPrompt, term);
            TermApp.prompt(term);
            term.write(ansiEscapes.cursorShow);
        }
      });
    },
  },
  socket: {
    description: "Test socket",
    action: async (term, params = []) => {
      term.writeln("Under construction.");
      return;
      // prompt_dispose.dispose();
      // const res = await fetch("/api/socket");
      // let socket = io();
      // console.log(socket);

      // const prompt = term.onData((e) => {
      //   switch (e) {
      //     // case Ctrl+Q
      //     case "\x11":
      //       term.writeln("\r\nForce quitting");
      //       socket.close();
      //       prompt.dispose();
      //       break;
      //   }
      //   socket.emit("message", e);
      // });

      // socket.on("message", (e) => {
      //   term.write(e);
      // });

      // socket.on("connect", () => {
      //   term.writeln("Connected!");
      // });

      // socket.on("disconnect", () => {
      //   term.writeln("Disconnected!");
      //   TermApp.onData(mainPrompt, term);
      //   TermApp.prompt(term);
      // });
      // console.log(res);
    },
  },
  curl: {
    description: "Perform a 'curl' request. Only works with GET requests.",
    action: async (term, params = []) => {
      if (params && params.length > 0) {
        let frame = 0;
        const interval = setInterval(() => {
          if (frame === cliSpinners.dots.frames.length) {
            frame = 0;
          }
          term.write(ansiEscapes.cursorLeft);
          term.write(ansiEscapes.eraseEndLine);
          term.write(cliSpinners.dots.frames[frame]);
          frame++;
        }, cliSpinners.dots.interval);

        prompt_dispose.dispose();

        const res = await fetch("/api/curl", {
          headers: {
            url: params[0],
          },
        });

        clearInterval(interval);
        term.writeln("");

        if (res.ok) {
          const data = await res.text();
          for (let line of data.split("\n")) {
            term.writeln(line);
          }
        } else {
          term.writeln(
            `${c.red("Error")}: ${res.status} ${
              res.statusText
            } \r\n${await res.text()}`
          );
        }

        TermApp.onData(mainPrompt, term);
        TermApp.prompt(term);
      } else {
        term.writeln(commands.curl.description);
        term.writeln("❌  Usage: curl <url>");
        TermApp.prompt(term);
      }
    },
  },
  user: {
    description: `Have the Vol'dunOS system recognize you indefinitely. \r\n\t\t\t${c.yellow(
      "...(Warning: this cannot be undone.... [not really] Here be Sethrak.)"
    )}`,
    action: async (term, params = []) => {
      // this is extensive because in theory, the rule of thumb is to never trust
      // the client for anything.
      // i'm not worried about fingerprint spoofing, but the system encourages
      // some sort of label as part of the immersion
      if (params && params.length > 0) {
        const userExists = async () => {
          const res = await fetch("api/user/get", {
            headers: {
              "x-fingerprint": currentFingerprint,
              name: params[0],
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.name === user) {
              return true;
            }
          } else {
            return false;
          }
          return false;
        };

        const exists = await userExists();

        if (exists) {
          term.writeln(`But you already have a username...`);
          TermApp.prompt(term);
          return;
        }

        prompt_dispose.dispose();

        term.write(
          `${c.yellow(
            "Warning:"
          )} You are about to be recognized by this system as ${
            params[0]
          }.\r\nIf you agree that this is your true destiny, and wish to continue on to the path ahead, confirm with (Y/N): `
        );

        const prompt = term.onData(async (e) => {
          switch (e) {
            case "Y":
            case "y":
              term.writeln("");
              const res = await fetch("api/user/set", {
                method: "POST",
                body: JSON.stringify({
                  name: params[0],
                  fingerprint: currentFingerprint,
                }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.message.includes("registered")) {
                  term.writeln(`❌ ${c.red("Error")}: ${data.message}`);
                } else {
                  user = params[0];

                  term.writeln(
                    `${c.green(
                      "✓"
                    )} You are now recognized as ${user}. Don't make any funny surprises. -Korthek`
                  );
                }
              } else {
                term.writeln(
                  `${c.red("Error")}: ${res.status} ${res.statusText}`
                );
              }

              term.writeln("");
              prompt.dispose();
              TermApp.onData(mainPrompt, term);
              TermApp.prompt(term);
              break;
            case "N":
            case "n":
              term.writeln("");
              term.writeln(`${c.red("✗")} You have not been recognized`);
              term.writeln("");
              prompt.dispose();
              TermApp.onData(mainPrompt, term);
              TermApp.prompt(term);
              break;
            default:
              term.writeln("Please confirm with (Y/N): ");
          }
        });
      } else {
        term.writeln(commands.user.description);
        term.writeln("❌  Usage: user <user>");
      }
    },
  },
  u_purge: {
    description:
      "Have the Vol'dunOS system completely forget everything about you, which is just your user in the database.",
    action: async (term, params = []) => {
      if (user === "oiku") {
        term.writeln(
          `${c.red("Error")}: You cannot purge yourself, silly Oiku.`
        );
        TermApp.prompt(term);
        return;
      }
      prompt_dispose.dispose();
      term.write(
        `\r\n${c.yellow("Warning:")} This will purge the user ${c.bold(
          user
        )} from the Vol'dunOS database, and it's up for grabs after that.\r\nYou can immediately reset it, but you'll have to re-register. using the ${c.bold(
          "user"
        )} command.\r\nAre you sure you want to do this? (Y/N): `
      );
      const prompt = term.onData(async (e) => {
        switch (e) {
          case "Y":
          case "y":
            term.writeln("");
            const res = await fetch("api/user/purge", {
              headers: {
                "x-fingerprint": currentFingerprint,
              },
            });
            if (res.ok) {
              const data = await res.json();
              term.writeln(data.message);
              await getUserIfExists(currentFingerprint);
            } else {
              term.writeln(
                `${c.red("Error")}: ${res.status} ${res.statusText}`
              );
            }
            user = "oiku";
            TermApp.onData(mainPrompt, term);
            TermApp.prompt(term);
            prompt.dispose();
            break;
          case "N":
          case "n":
            term.writeln("");
            TermApp.onData(mainPrompt, term);
            TermApp.prompt(term);
            prompt.dispose();
            break;
          default:
            term.writeln("Please enter Y or N.");
            break;
        }
      });
    },
  },
  chamber: {
    description: `Enter the Chamber of Anamnesis... Special agreement is required.`,
    action: async (term, params = []) => {
      prompt_dispose.dispose();
      term.writeln("You are about to enter the Chamber of Anamnesis.");
      term.writeln("You accept everything that will happen from now on.");
      const prompt = term.onData(async (e) => {
        switch (e) {
          case "Y":
          case "y":
            const audio = new Audio();
            audio.src = "audio/another.ogg";
            audio.onloadeddata = () => {
              currentStates.vulperaContext.setMouseSpringActive(false);
              term.write("\r\nYou have made a wise decision.\r\n");
              audio.play();
              currentStates.vulperaContext.terminalSpringApi.start({
                opacity: 0,
              });
              setTimeout(() => {
                currentStates.vulperaContext.setVideoState({
                  scale: 2,
                  opacity: 1,
                });
              }, 1500);
            };

            audio.onended = () => {
              audio.currentTime = 2;
              audio.play();
            };
          case "N":
          case "n":
            term.writeln("");
            TermApp.onData(mainPrompt, term);
            TermApp.prompt(term);
            prompt.dispose();
            break;
          default:
            term.writeln("Please enter Y or N.");
            break;
        }
      });
    },
  },
};

const secondPrompt = (e, term, ctx) => {
  switch (e) {
    case "\u0003": // Ctrl+C
      term.writeln("^C");
      TermApp.prompt(term);
      TermApp.onData(mainPrompt, term);
      break;
  }
};

const mainPrompt = (e, term, ctx) => {
  switch (e) {
    case "\u0003": // Ctrl+C
      term.writeln("^C");
      historyIndex = history.length - 1;
      TermApp.prompt(term);
      TermApp.onData(mainPrompt, term);
      break;
    case "\u007F": // Backspace
      // the magic 3 is because of the ⌨️ character
      if (term._core.buffer.x > c.unstyle(prompt).length - 3) {
        term.write("\b \b");
        if (command.length > 0) {
          command = command.substr(0, command.length - 1);
        }
      }
      break;
    case "\u001b[B": // Arrow Down
      if (historyIndex < history.length - 1) {
        if (command.length > 0) {
          term.write(ansiEscapes.cursorBackward(command.length));
          term.write(ansiEscapes.eraseEndLine);
        }
        historyIndex++;
        command = history[historyIndex];
        term.write(command);
      } else {
        historyIndex = history.length;
        command.length > 0 &&
          term.write(ansiEscapes.cursorBackward(command.length));
        command = "";
        term.write(ansiEscapes.eraseEndLine);
      }
      break;
    case "\u001b[A": // Arrow Up
      if (historyIndex > 0) {
        if (command.length > 0) {
          term.write(ansiEscapes.cursorBackward(command.length));
          term.write(ansiEscapes.eraseEndLine);
        }
        historyIndex--;
        command = history[historyIndex];
        try {
          term.write(command);
        } catch (e) {}
      }
      break;
    case "\r": // Enter
      TermApp.runCommand(term);
      historyIndex = history.length;
      command = "";
      break;
    default:
      if (
        (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7e)) ||
        e >= "\u00a0"
      ) {
        command += e;
        term.write(e);
      }
  }
};

export const TermApp = {
  init: () => {
    return new Terminal({
      cursorBlink: true,
      fontSize: 14,
      allowTransparency: true,
      theme: {
        foreground: "#F8F8F8",
        background: "#1E1E1E00",
        selection: "#5DA5D533",
        black: "#1E1E1D",
        brightBlack: "#262625",
        red: "#CE5C5C",
        brightRed: "#FF7272",
        green: "#5BCC5B",
        brightGreen: "#72FF72",
        yellow: "#CCCC5B",
        brightYellow: "#FFFF72",
        blue: "#5D5DD3",
        brightBlue: "#7279FF",
        magenta: "#BC5ED1",
        brightMagenta: "#E572FF",
        cyan: "#5DA5D5",
        brightCyan: "#72F0FF",
        white: "#F8F8F8",
        brightWhite: "#FFFFFF",
      },
    });
  },
  updateHistory: () => {
    window.localStorage.setItem("history", JSON.stringify(history));
  },
  prompt: (term) => {
    const prompt = `⌨️  ${c.yellow("[")}${c.green(getUser())}@${c.cyan(
      "vulpera.com"
    )}${c.yellow("]")}:${c.magenta("~/")}» `;
    term.write(`${prompt}${command.length > 0 ? command : ""}`);
  },
  intro: (term, version) => {
    motd(term, version);
    TermApp.prompt(term);
  },
  break: (term) => {
    term.writeln("");
  },
  runCommand: (term) => {
    const input = command.split(" ");
    const prefix = input[0];
    const params = input.slice(1);
    if (command.length > 0) {
      history.push(command);
      TermApp.updateHistory();
      command = "";
      if (prefix in commands) {
        if (prefix != "clear") {
          term.writeln("");
        }
        commands[prefix].action(term, params);
      } else {
        term.writeln("");
        term.writeln(
          `❌  ${c.whiteBright(prefix)}: ${c.red("command not found")}`
        );
        TermApp.prompt(term);
      }
    } else {
      term.writeln("");
      TermApp.prompt(term);
    }
  },
  onData: (p, term, ctx = {}) => {
    if (prompt_dispose != null) {
      prompt_dispose.dispose();
    }
    prompt_dispose = term.onData((e) => {
      p(e, term, ctx);
    });
  },
};

const getUserIfExists = async (fingerprint) => {
  const res = await fetch("api/user/get", {
    headers: { "x-fingerprint": fingerprint },
  });
  if (res.ok) {
    const data = await res.json();
    user = data.name;
  } else {
    console.log(`Failed to get user: ${res.status}`);
  }
};

export const assembleTerminal = async (states) => {
  currentStates = states;
  currentFingerprint = states.mainContext.fingerprint;
  await getUserIfExists(states.mainContext.fingerprint);
  const terminal = TermApp.init();
  if (window.localStorage.getItem("history") != null) {
    history = JSON.parse(window.localStorage.getItem("history"));
  }
  historyIndex = history.length - 1;
  terminal.open(states.terminalRef.current);

  if (window.vulpera) {
    terminal.writeln(`*sniff*... I can smell you...`);
    const time = new Date().getTime();
    window.vulpera.ipc.invoke("notify").then((data) => {
      terminal.writeln(
        `\r\nYoink. node version ${data.versions.node}. Took me ${
          new Date().getTime() - time
        } milliseconds.`
      );
      terminal.writeln(`*gasp* Electron ${data.versions.electron} too!`);
    });
  }
  // FitAddon
  terminal.loadAddon(fitAddon);

  const resizeWindow = () => {
    if (fitAddon != null) {
      fitAddon.fit();
      states.setTerminalSize({
        width: states.terminalRef.current.clientWidth,
        height: states.terminalRef.current.clientHeight,
      });
    }
  };

  // states.parentTerminalRef.current.addEventListener("mouseenter", () => {
  //   states.terminalSpringApi.start({ scale: 1.05, onFrame: resizeWindow });
  // });

  // states.parentTerminalRef.current.addEventListener("mouseleave", () => {
  //   states.terminalSpringApi.start({ scale: 1, onFrame: resizeWindow });
  // });

  window.addEventListener("resize", resizeWindow);

  // WebglAddon
  try {
    const webglAddon = new WebglAddon();
    terminal.loadAddon(webglAddon);
    console.log("WebGL Enabled!");
  } catch (e) {}

  states.setTerminalOpen(true);
  states.setTerminal(terminal);

  const res = await fetch("api/version");
  const data = await res.json();

  TermApp.intro(terminal, data.version);
  TermApp.onData(mainPrompt, terminal, states);

  fitAddon.fit();
  // give back the terminal when we're done
  return terminal;
};
