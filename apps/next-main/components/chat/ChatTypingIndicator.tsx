import React from "react";

import styled, {keyframes} from "styled-components";

const bounce = keyframes`
  0%, 80%, 100% { 
    transform: scale(.5);
  } 
  40% { 
    transform: scale(1.0);
  }
`;

const TypingContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  
  &.visible {
    opacity: 1;
  }
`;

const Dot = styled.div`
  background-color: #b2b2b2;
  border-radius: 50%;
  width: 4px;
  height: 4px;
  margin: 0 3px;
  animation: ${bounce} 1.4s infinite ease-in-out;

  &:nth-child(1) {
    animation-delay: -0.32s;
  }

  &:nth-child(2) {
    animation-delay: -0.16s;
  }
`;

const ChatTypingIndicator: React.FC = () => {
  return (
    <TypingContainer className="visible">
      <Dot />
      <Dot />
      <Dot />
    </TypingContainer>
  );
};

export default ChatTypingIndicator;
