import { Server } from "socket.io";
import Docker from "dockerode";

const handler = async (req, res) => {
  if (res.socket.server.io) {
    console.log("Socket.io is running");
    res.end();
  } else {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    const docker = new Docker({
      host: "http://172.23.154.22",
      port: 4243,
    });
    const container = docker.getContainer("d9bf6cb950d9");

    let dockerStream;

    container.attach(
      {
        stream: true,
        stdout: true,
        stderr: true,
        stdin: true,
      },
      (err, stream) => {
        if (err) {
          console.log(err);
          return;
        }
        dockerStream = stream;
      }
    );

    io.on("connection", (sock) => {
      sock.on("message", (msg) => {
        if (dockerStream) {
          dockerStream.write(msg);
        }
      });

      dockerStream.on("data", (data) => {
        sock.emit("message", data.toString());
      });
    });
  }
  // const container = await docker.container.create({
  //   Image: "alpine",
  //   Cmd: ["/bin/sh"],
  //   AttachStdin: true,
  //   AttachStdout: true,
  //   AttachStderr: true,
  //   Tty: true,
  //   OpenStdin: true,
  //   StdinOnce: true,
  //   Env: ["TERM=xterm", "LANG=en_US.UTF-8", "LC_ALL=en_US.UTF-8"],
  // });

  // await container.start();

  // const c = await container.attach({ Stdin: true, Stdout: true, Stderr: true });
  res.end();
};

export default handler;
