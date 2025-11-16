# GradeX By Stark

A modern, tech-inspired grade planning tool for tracking semester courses, calculating SGPA, and determining required semester exam scores to achieve target grades. Built with a sleek dark theme and Iron Man-inspired aesthetics.

🌐 **Live Demo**: [https://gradex.vercel.app](https://gradex.vercel.app) | [Production URL](https://gradex-4ijnz0rsg-starkags-projects.vercel.app)

![GradeX Screenshot](screenshot.png)
*Note: Add a screenshot of the application to showcase the UI*

## ✨ Features

### GradeX Planner
- 📊 **SGPA Calculator**: Automatically calculates Semester Grade Point Average based on included courses
- 🎯 **Smart Goal Calculator**: Auto-calculates required semester exam score based on selected target grade with dynamic percentage display
- 📝 **Course Management**: Add, edit, and remove courses with custom credits and scores
- 💾 **Local Storage**: All data persists in browser localStorage
- 🎨 **Modern UI**: Dark brutalist theme with monochrome aesthetic and smooth animations
- 🔄 **Reset Function**: Restore default courses with one click
- 🚀 **Entry Animation**: Tech-inspired splash screen with Arc Reactor animation
- 🎵 **Easter Egg**: Hidden play button for music
- 📱 **Fully Responsive**: Optimized for all devices (mobile, tablet, desktop)
- 🎓 **Grade Tracking**: Supports both incomplete (60 marks) and complete (100 marks) courses

### SRMIST Seat Finder (v3.0)
- 🔍 **Live Real-Time Fetch**: Data fetched with the frequency of 1 minute with exceptional accuracy
- 🏫 **Multi-Campus Support**: Searches across Main Campus, Tech Park, Biotech & Architecture, and University Building
- ⚡ **Auto-Refresh**: Automatically updates seat information every 3 minutes
- 💾 **Smart Caching**: 5-minute cache reduces API calls by 80% for better performance
- 📋 **Complete Information**: Displays Name, Seat No., Room/Venue, Floor, Department, Subject Code, and Session
- 🎨 **Room Formatting**: Automatically formats room names (TPTP→TP, TPVPT→VPT)
- 🏢 **Floor Detection**: Smart extraction of floor numbers from room names
- 📸 **Venue Images**: Aesthetic venue maps for UB, TP, and TP2
- 📱 **Mobile Optimized**: Fully responsive with touch-friendly interface
- 🖥️ **Desktop Animation**: Smooth slide animation when seat info is found
- 📧 **Support Contact**: Easy access to support email for inquiries

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/StarkAg/GradeX.git
cd GradeX
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 📖 Usage

### GradeX Planner
1. **View Courses**: All courses are displayed in cards showing current scores, credits, and target grades
2. **Select Target Grade**: For incomplete courses (60 marks), select your target grade (C, B, B+, A, A+, O) to see required exam marks
3. **Auto-Calculated Goals**: The required semester exam score is automatically calculated and displayed with percentage
4. **Edit Courses**: Click "Edit" on any course card to modify title, credits, or internals
5. **Add Courses**: Click "Add course" to add new courses with status (60/100 marks)
6. **Include/Exclude**: Toggle courses in/out of SGPA calculation
7. **Complete Courses**: Courses with 100 marks automatically show achieved grade (no exam needed)
8. **Help Guide**: Click the "?" button for quick usage guide

### SRMIST Seat Finder
1. **Enter Details**: Input your Register Number (RA number) and exam date
2. **Quick Selection**: Use "Today" or "Tomorrow" buttons, or enter custom date (DD/MM/YYYY)
3. **Find Seat**: Click "Find My Seat" to search across all 4 campuses
4. **View Results**: See complete seat information including:
   - Student Name and Department
   - Seat Number
   - Room/Venue with building name
   - Floor number
   - Subject Code
   - Session (Forenoon/Afternoon)
5. **Auto-Refresh**: Seat information automatically updates every 3 minutes
6. **Venue Maps**: View venue layout images for UB, TP, and TP2 buildings
7. **Support**: Contact ha1487@srmist.edu.in for any problems or inquiries

## 📊 Grade Scale

- **F**: < 50% (0 points)
- **C**: ≥ 50% (5 points)
- **B**: ≥ 56% (6 points)
- **B+**: ≥ 61% (7 points)
- **A**: ≥ 71% (8 points)
- **A+**: ≥ 81% (9 points)
- **O**: ≥ 91% (10 points)

## 🎯 Calculation Logic

- **Incomplete Courses (60 marks)**: Current score is out of 60 internal marks. Exam contributes 40 marks out of 100 total. Required exam marks are calculated to achieve target grade.
- **Complete Courses (100 marks)**: Final grade is calculated directly from the score. No exam needed.

## 🛠️ Technology Stack

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **CSS3**: Custom styling with animations and responsive design
- **LocalStorage API**: Data persistence

### Backend (Seat Finder API)
- **Node.js**: Serverless functions
- **Vercel Functions**: API endpoints
- **Supabase**: PostgreSQL database for student data (6,177+ records)
- **HTML Scraping**: Real-time data extraction from SRM exam cell
- **In-Memory Caching**: 5-minute TTL for optimal performance
- **Multi-Campus Support**: Parallel fetching from 4 campus endpoints

## 🎨 Design

- Dark theme (#020202 background)
- Monochrome color palette
- Bebas Neue & Space Grotesk fonts
- Brutalist aesthetic
- Smooth animations and transitions
- Fully responsive grid layouts

## 📱 Responsive Design

- **Desktop**: 3-4 column grid layout
- **Tablet**: 2 column grid layout
- **Mobile**: Single column layout
- **Touch Optimized**: Larger touch targets for mobile devices

## 🎁 Easter Eggs

- Hidden play button next to Arc Reactor icon
- "Welcome EWW" message for specific grade patterns

## 👨‍💻 Creator

**Harsh Agarwal (Stark)**

- GitHub: [@StarkAg](https://github.com/StarkAg)
- LinkedIn: [harshxagarwal](https://in.linkedin.com/in/harshxagarwal)

## 📝 License

Private project - All rights reserved

---

*PS — came into existence on 12th Nov :) since ClassPro and Etc. were unreliable manytimes :(*
