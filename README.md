# ALGO Project

Course Scheduling System for my ALGO Course

## Overview

This project is an intelligent course scheduling system built to help organize and manage course timetables efficiently. It features a web-based interface with constraint satisfaction algorithms for optimal schedule generation.

## Project Structure

- **gik-scheduler/** - Next.js web application (frontend + API)
  - `src/app/` - Next.js app directory with pages and API routes
  - `src/components/` - React components
  - `src/lib/` - Utility functions, constraints, and algorithms
- **data/** - Course and scheduling data files
  - `courses.csv` - Course information
  - `timeslots.csv` - Available time slots
  - `gik-data-with-sections.json` - Detailed course sections data
- **scripts/** - Utility scripts for data processing and testing

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/ALGO-Project.git
cd ALGO-Project
```

2. Install dependencies:
```bash
cd gik-scheduler
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

