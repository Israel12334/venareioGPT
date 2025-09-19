# VeraneioGPT AI

## Overview

VeraneioGPT AI is a Brazilian-themed AI chatbot web application that provides an uncensored chat interface with multiple AI models. The project is built as a single-page application using vanilla HTML, CSS, and JavaScript, focusing on a glassmorphism design aesthetic with Brazilian cultural elements. The application serves as a frontend interface for various AI models through the OpenRouter API, offering features like conversation memory, customizable system prompts, and multiple AI model selection.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single-Page Application (SPA)**: Built with vanilla HTML, CSS, and JavaScript without any frameworks
- **Glassmorphism Design Pattern**: Uses semi-transparent glass-like elements with backdrop blur effects
- **Responsive Design**: Mobile-first approach with collapsible sidebar for smaller screens
- **Theme System**: Light and dark mode toggle with CSS custom properties for dynamic theming
- **Component-Based Structure**: Modular JavaScript functions handling different UI components (sidebar, chat, settings modal)

### State Management
- **Local Storage Persistence**: Chat history, user settings, and API configurations stored in browser's localStorage
- **Memory System**: Custom "Salve que..." feature for context retention across conversations
- **Real-time UI Updates**: Dynamic DOM manipulation for chat messages and UI state changes

### API Integration Architecture
- **OpenRouter API Client**: Custom implementation for communicating with multiple AI models
- **Streaming Support**: Real-time message streaming for better user experience
- **Model Abstraction**: Unified interface for different AI models (Llama, Mixtral, Venice Uncensored)
- **Error Handling**: Comprehensive error management with user-friendly notifications

### UI/UX Features
- **Animated Background**: CSS-based particle system and gradient animations
- **Easter Eggs System**: Konami code implementation and console commands for special effects
- **Interactive Elements**: Hover effects, transitions, and micro-interactions
- **Accessibility**: Semantic HTML structure with proper ARIA labels and keyboard navigation

### Security Considerations
- **Client-Side API Key Storage**: API keys stored in localStorage (note: this is not secure for production)
- **Input Sanitization**: Basic XSS protection through proper DOM manipulation
- **HTTPS Requirements**: External API calls require secure connections

## External Dependencies

### Third-Party APIs
- **OpenRouter API**: Primary AI model provider offering access to multiple LLM models
- **Multiple AI Models**: Llama, Mixtral, Venice Uncensored, and other models available through OpenRouter

### External Libraries
- **Lucide Icons**: Icon library for UI elements and interface components
- **Google Fonts**: Inter and JetBrains Mono fonts for typography
- **Font Awesome** (referenced): For additional icon support

### Browser APIs
- **LocalStorage API**: For persistent data storage of chats and settings
- **Fetch API**: For HTTP requests to external AI services
- **DOM APIs**: For dynamic content manipulation and event handling
- **CSS Custom Properties**: For dynamic theming and style management

### Development Tools
- **No Build Process**: Direct browser execution without compilation or bundling
- **No Package Manager**: All dependencies loaded via CDN links
- **Version Control**: Basic file structure suitable for Git-based workflows