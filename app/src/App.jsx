import { useState } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const systemMessage = {
  role: 'system',
  content: "Explain things like you're talking to a software professional with 2 years of experience."
};
const MyComponent = ({ size = "1x" }) => (
  <FontAwesomeIcon icon={faCoffee} size={size} />
);
console.log("API Key:", API_KEY);


function App() {
  const [messages, setMessages] = useState([
    {
      message: "Hello, I'm ChatGPT! Ask me anything!",
      sender: "ChatGPT",
      direction: "incoming"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (message) => {
    const newMessage = { message, sender: "user", direction: "outgoing" };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setIsTyping(true);
    await processMessageToChatGPT(newMessages);
  };

  async function processMessageToChatGPT(chatMessages) {
    const apiMessages = chatMessages.map(({ sender, message }) => ({
      role: sender === "ChatGPT" ? "assistant" : "user",
      content: message
    }));
  
    const apiRequestBody = {
      model: "gpt-4o-mini",
      messages: [systemMessage, ...apiMessages]
    };
  
    let retries = 3;
    let success = false;
    let response, data;
  
    while (retries > 0 && !success) {
      try {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(apiRequestBody)
        });
  
        if (response.status === 429) {
          console.warn("Слишком много запросов. Ждем 5 секунд перед повтором...");
          await new Promise(resolve => setTimeout(resolve, 20000)); 
          retries--;
          continue;
        }
  
        data = await response.json();
        if (data.choices && data.choices.length > 0) {
          setMessages([...chatMessages, {
            message: data.choices[0].message.content,
            sender: "ChatGPT",
            direction: "incoming"
          }]);
          success = true;
        } else {
          console.error("Ошибка API: Неверный ответ", data);
        }
      } catch (error) {
        console.error("Ошибка запроса к API:", error);
      }
    }
  
    if (!success) {
      console.error("Ошибка: Не удалось получить ответ от OpenAI после нескольких попыток.");
    }
  
    setIsTyping(false);
  }
  

  return (
    <div className="App">
      <div style={{ position: "relative", height: "800px", width: "700px" }}>
        <MainContainer>
          <ChatContainer>
            <MessageList
              scrollBehavior="smooth"
              typingIndicator={isTyping ? <TypingIndicator content="ChatGPT is typing..." /> : null}
            >
              {messages.map((msg, i) => (
                <Message key={i} model={msg} />
              ))}
            </MessageList>
            <MessageInput placeholder="Type message here" onSend={handleSend} />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}

export default App;
