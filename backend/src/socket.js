
import { Server } from "socket.io";

export const initSocket = (server)=>{
 const io=new Server(server,{cors:{origin:"*"}});
 io.on("connection",socket=>{
  console.log("client connected");
 });
 return io;
};
