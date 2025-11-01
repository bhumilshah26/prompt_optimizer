import React from "react";

export default function ChatMessage({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`message ${isUser ? "user" : "assistant"}`}>
      <div className="message-bubble">
        {content.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}
