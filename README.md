# 🎬 Noosa Studio

> **Create your own film studio.**

Noosa Studio is an AI-powered multi-agent film studio that enables creators to generate story-driven videos through a visual node-based workflow. Instead of relying on a single prompt, creators build AI production pipelines where specialized agents collaborate to plan, write, review, generate, and distribute videos automatically.

Built for the **Qwen Cloud Global Hackathon 2026**.

---

# ✨ Features

* 🎬 Visual node-based AI workflow
* 🤖 Multi-agent orchestration
* 🎭 AI Character Generator
* 🗣️ Storytelling with AI Text-to-Speech
* 🎥 AI Video Generation
* 📲 Telegram integration
* 💾 Save & load studios
* 📁 Workflow templates
* ☁️ Alibaba Cloud ECS Worker
* 🗄️ Supabase integration

---

# 🏠 Landing Page

The landing page serves as the main workspace manager.

Users can:

* Create a new studio
* Open previously saved studios
* Continue existing projects

Each studio represents one social media channel or content production workflow.

---

# ➕ Creating a Studio

Click **Create Studio** to create a new AI production workspace.

Users configure:

## Studio Name

The name of the studio.

Example:

```text
My First Studio
```

---

## Workflow Template (Required)

### Basic

Fast workflow.

```text
Producer
      │
      ▼
Writer
      │
      ▼
Video Generator
```

---

### Precise

Adds script validation.

```text
Producer
      │
      ▼
Writer
      │
      ▼
Reviewer
      │
      ▼
Video Generator
```

---

### Advanced

Maximum quality workflow.

```text
Producer
      │
      ▼
Reviewer
      │
      ▼
Writer
      │
      ▼
Reviewer
      │
      ▼
Video Generator
```

---

## Optional Add-ons

### Storytelling (TTS)

Adds an AI voice-over node for narration.

### Character Generator

Adds an Actor node for consistent AI characters.

---

# 🎬 Studio Workspace

After creating a studio, users enter the visual editor where the complete AI production workflow is built.

---

## Top Navigation

The top navigation bar contains the global project actions.

* Back
* Studio name
* Save
* Run Pipeline
* Share
* User Profile

---

## Video Configuration

Each studio starts with several configuration options.

### Niche / Channel Topic

Defines the overall identity of the channel.

Examples:

```text
Space Mysteries & Fun Facts
```

```text
Life in Ancient Egypt
```

```text
T-Rex Loves Calculus
```

This context guides every AI agent throughout the workflow.

---

### Video Title

Name of the generated video.

---

### Duration

Supported durations:

* 5 Seconds
* 15 Seconds
* 30 Seconds

---

### Language

Supported languages include:

* English
* Indonesian
* Japanese
* Mandarin
* French
* Spanish
* Korean
* Arabic
---

# 🖥️ Infinite Canvas

The workspace is built around an infinite node editor.

Features include:

* Infinite canvas
* Grid background
* Drag & Drop
* Zoom
* Pan
* Minimap
* Undo / Redo

Users visually connect AI agents to build customized production pipelines.

---

# 🤖 Available Nodes

## Input Node

Allows manual prompts.

Studios containing an Input node require users to enter a prompt every time a video is generated.

---

## Producer Node

Creates:

* Concept
* Genre
* Story outline


## Writer Node

Transforms concepts into complete scripts.

Responsibilities:

* Story expansion
* Scene generation
* Dialogue writing


## Reviewer Node

Reviews script quality.

If the output does not meet the required quality, it requests the Writer node to regenerate the script before continuing.

## Actor Node

Defines recurring AI characters. 
Users are free to enter prompt and references.
Automatically triggers Image generation if no image references or prompt were found.

## Text-to-Speech Node

Generates AI narration for storytelling videos.

---

## Video Generator Node

Generates the final AI video.

---

## Telegram Node

Automatically sends completed videos to Telegram.

### Configuration

Bot Token

Obtained through **@BotFather**

Chat ID

Destination Telegram chat.

### Output Mode

* Disabled
* Output Only

The node receives generated videos from the previous node and delivers them directly to the configured Telegram chat.

* Input and Output
Enter prompt and receive ouput straight from and to telegram.

---

## Cloud Node

Store the output to CloudFlare R2

---

# 🔗 Node Connections

Nodes communicate through visual connections.

Example:

```text
Producer
      │
      ▼
Writer
      │
      ▼
Reviewer
      │
      ▼
Video Generator
      │
      ▼
Telegram
```

The output of one node automatically becomes the input of the next node.

---

# ▶ Running a Pipeline

Running the pipeline executes every connected node sequentially.

Example execution:

1. Producer generates the concept.
2. Writer expands the story.
3. Reviewer validates the script.
4. Video Generator creates the final video.
5. Telegram Node delivers the generated video.

---

# 💾 Saving Studios

Studios can be saved and reopened at any time.

Saved workflows preserve:

* Node layout
* Connections
* Instructions
* Configuration
* Workflow template

---

# 🏗️ Tech Stack

## Frontend

* Next.js

## Backend

* Next.js

## Database

* Supabase

## Cloud Infrastructure

* Alibaba Cloud ECS

## AI Models

### Text

* qwen3.5-flash
* qwen3-max

### Image

* qwen-image-plus

### Video

* Wan2.7-i2v
* Wan2.7-t2v

### TTS

*qwen3-tts-flash

### Vision Model

* qwen-vl-max
  
## Integration

* Telegram Bot API

---

# 🚀 Vision

Noosa Studio is more than an AI video generator.

It is a visual AI production system where specialized AI agents collaborate like a real creative team, enabling creators to build scalable, automated, and story-driven content pipelines for the next generation of content creation.
