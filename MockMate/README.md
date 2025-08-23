# MockMate

## Project Overview
MockMate is an AI-powered interview preparation and mock interview platform. It helps users prepare for job interviews by generating role-specific questions and answers, providing detailed explanations, and offering mock interview sessions with AI feedback and analytics.

---

## Tech Stack
- **Frontend:** React (JavaScript), Tailwind CSS
- **Backend:** Node.js, Express, MongoDB (Mongoose ODM, Atlas Cloud)
- **AI Integration:** Google Gemini API (Generative AI)
- **Authentication:** JWT (JSON Web Tokens)

---

## Project Structure
```
MockMate/
  client/   # React frontend
  server/   # Node.js backend
```

---

## Phase 1: Project Setup & Core Infrastructure ✅

### What was accomplished:
- Initialized Git repository and project structure (`client/` and `server/` folders).
- Set up Node.js + Express backend with a test API route (`/api/ping`).
- Set up React frontend using Vite.
- Installed and configured Tailwind CSS for modern, responsive UI.
- Configured Vite to proxy API requests to the backend.
- Verified API connection from frontend to backend ("API Test: pong").
- Fixed all compatibility and configuration issues for smooth development.

---

## Phase 2: User Authentication & Security ✅

### What was accomplished:
- Switched backend database from PostgreSQL to MongoDB Atlas for easier integration and cloud access.
- Installed and connected MongoDB using Mongoose ODM.
- Created a Mongoose user model (`User.js`).
- Backend successfully connects to MongoDB Atlas ("MongoDB Atlas connected!" on startup).
- Implemented registration and login endpoints with password hashing and JWT.
- Enabled CORS for frontend-backend communication.
- Built a modular, visually appealing frontend with React and Tailwind CSS.
- Registration and login work from both Postman and the frontend, with JWT-based authentication and protected routes.

---

## Phase 3: AI-Powered Interview Question Generation ✅

### What was accomplished:
- Integrated Google Gemini API for generating interview questions and answers.
- Created `/api/questions` endpoint that accepts job role and full job description.
- Successfully tested with Postman: users can paste the entire job description from a job posting, and the API generates 5 Q&A pairs.
- API-based architecture allows easy testing and future frontend/mobile integration.

---

## Phase 4: Enhanced Learning Features ✅

### What was accomplished:
- Frontend integration of "Learn More" and pinning features.
- "Learn More" now provides direct, detailed explanations of concepts (not feedback or review).
- Pinned questions move to the top of the Q&A list in the UI for better visibility.
- Pin/unpin and explanation APIs are fully integrated and tested from both frontend and Postman.

---

## Challenges Faced & Solutions
- **Local MongoDB setup issues:** Faced errors due to missing data directory. Solved by switching to MongoDB Atlas (cloud database).
- **CORS errors:** Frontend requests were blocked by browser. Solved by adding the `cors` middleware to the backend.
- **Frontend-backend integration:** Ensured correct API URLs and enabled CORS for smooth communication.
- **Cloud database migration:** Updated backend to use Atlas connection string and environment variables.
- **OpenAI quota exceeded:** Switched to Google Gemini API for free, reliable LLM access.
- **Prompt engineering:** Refined prompts to Gemini to ensure explanations are direct and educational, not feedback or review.
- **UI/UX:** Improved forms and dashboard with Tailwind CSS for a modern, responsive look. Implemented logic to move pinned questions to the top of the list for better usability.

---

## Phase Progress
- [x] Phase 1: Project Setup & Core Infrastructure
- [x] Phase 2: User Authentication & Security
- [x] Phase 3: Interview Question Generation
- [x] Phase 4: Enhanced Learning Features
- [ ] Phase 5: Mock Interview & Voice Input
- [ ] Phase 6: Analytics & User Dashboard
- [ ] Phase 7: Final Touches & Deployment

---

## Phase Updates
### Phase 1
- Backend and frontend initialized and connected.
- Tailwind CSS fully working in React (Vite) app.
- API communication between frontend and backend confirmed.
- All setup/config errors resolved.

### Phase 2
- Switched to MongoDB Atlas for backend database.
- Mongoose user model created and backend connection verified.
- Registration and login endpoints implemented and tested from both frontend and Postman.
- JWT tokens generated and used for protected routes.
- CORS enabled for frontend-backend integration.
- UI/UX improved with Tailwind CSS.

### Phase 3
- Google Gemini API integrated for AI-powered question generation.
- `/api/questions` endpoint supports full job descriptions pasted by users.
- Successfully tested in Postman with real job descriptions.

### Phase 4
- "Learn More" and pinning features fully integrated in the frontend.
- Pinned questions move to the top of the list for better user experience.
- Explanations are now direct and educational.

---

## Next Steps
- **Pinned Questions Page:** Add a page or section where users can view all their pinned questions.
- **Mock Interview APIs:** Implement `/api/mock/start` and `/api/mock/answer` for mock interview flow.
- **Analytics & Dashboard:** Add analytics and feedback features to the user dashboard.
- **UI/UX Polish:** Continue improving the interface, add notifications, and robust error handling.

---

## Getting Help
If you get stuck, ask for help or search for tutorials on the specific technology (Node.js, React, MongoDB, Gemini API, etc.). 