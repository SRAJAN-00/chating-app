import React, { useEffect, useState } from "react";
import { WS_URL } from "../../../config";
import Drawingboard from "./Drawingboard";

export default function Collabrative() {
  const [size, setSize] = useState("3");
  const [stroke, setStroke] = useState<any[]>([]);
  const [color, setColor] = useState("red");
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onmessage = (event) => {
      const stroke = JSON.parse(event.data);
      setStroke((prev) => [...prev, stroke]);
      setSocket(ws);
      return () => ws.close();
    };
  }, []);

  const handelDraw=(stroke:any){
   setStroke((prev) => [...prev, stroke]);
   socket?.send(JSON.stringify(stroke))
  }
  return <div className="flex flex-col">
<Drawingboard stroke={stroke} onDraw={handelDraw} size={size} color={color}/>
  </div>;
}
