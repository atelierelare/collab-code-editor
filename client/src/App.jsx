import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("http://localhost:8000");

function App() {
  const [code, setCode] = useState("// Start typing here...");
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState(0);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const chatEndRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => {});

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("load-chat", (chat) => {
      setMessages(chat);
    });

    socket.on("receive-text", (data) => {
      setCode(data);
    });

    socket.on("load-code", (data) => {
      setCode(data);
    });

    socket.on("users-count", (count) => {
      setUsers(count);
    });

    socket.on("load-language", (lang) => {
      setLanguage(lang);
    });

    socket.on("language-changed", (lang) => {
      setLanguage(lang);
    });

    return () => {
      socket.off("receive-message");
      socket.off("receive-text");
      socket.off("load-chat");
      socket.off("load-code");
      socket.off("users-count");
      socket.off("load-language");
      socket.off("language-changed");
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinRoom = () => {
    if (roomId && username) {
      socket.emit("join-room", { roomId, username });
      setJoined(true);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send-message", message);
    setMessage("");
  };

  const handleChange = (value) => {
    setCode(value);
    if (joined) socket.emit("send-text", value);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* CHAT */}
      <div
        style={{
          width: "300px",
          background: "#1e1e1e",
          color: "white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "10px", fontWeight: "bold" }}>
          Chat
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <b style={{ color: "#4ea1ff" }}>
                {msg.username}
              </b>

              <div>{msg.text}</div>

              <small style={{ color: "#888" }}>
                {msg.time}
              </small>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div style={{ display: "flex", padding: "10px" }}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type message..."
            style={{ flex: 1, padding: "8px" }}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>

      {/* EDITOR */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "10px",
            display: "flex",
            gap: "10px",
            background: "#1e1e1e",
            color: "white",
          }}
        >
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />

          <button onClick={joinRoom}>Join</button>

          <div>Users: {users}</div>
        </div>

        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

export default App;