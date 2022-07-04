import { Server } from "socket.io";
import { Docker } from "node-docker-api";

const handler = async (req, res) => {
  const docker = new Docker({
    host: "http://172.27.36.119",
    port: 4243,
  });

  const container = await docker.container.create({
    Image: "alpine",
    Cmd: ["/bin/sh"],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    OpenStdin: true,
    StdinOnce: true,
    Env: ["TERM=xterm", "LANG=en_US.UTF-8", "LC_ALL=en_US.UTF-8"],
  });

  await container.start();

  let socket = new WebSocket(
    "http://172.27.36.119:4243/containers/d9bf6cb950d9/attach/ws?logs=1&stream=1&stdin=1&stdout=1&stderr=1"
  );

  res.socket.server.io = socket;

  res.end();
};

export default handler;
