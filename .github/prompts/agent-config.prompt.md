---
name: agent-config
description: Use this prompt to generate a new feature or web app with the specified tech stack and file structure.
---
While creating/Implementing a feature or web app, make sure the tech stack and file structure is as following

Tech stack:
- Frontend: Next.js, Tailwind CSS, TypeScript, MUI
- Backend: Node.js, Express, Supabase

These are example file structures for both frontend and backend. You can modify them as needed, but make sure to maintain a clear and organized structure.

Medical queue management system file structure:

backend/
├── api/
│   ├── auth/
│   │   ├── crud/
│   │   │	 ├── getProfile.js
│   │   │	 └── updateProfile.js
│   │   ├── auth.handler.js
│   │   ├── auth.routes.js
│   │   └── index.js
│   ├── patients/
│   │   ├── crud/
│   │   │	 ├── getPatients.js
│   │   │	 └── updatePatients.js
│   │   ├── patients.handler.js
│   │   ├── patients.routes.js
│   │   └── index.js
│   └── queues/
│       ├── crud/
│       ├── queues.handler.js
│       ├── queues.routes.js
│       └── index.js
├── config/
│   ├── config.env
│   └── supabase.js
├── middleware/
│   ├── auth.js
│   └── validateThaiId.js
├── migrations/
│   └── seeds/
├── router.js
├── server.js
└── package.json

frontend/
├── src/
│   ├── app/
│   │   ├── (queueinfo)/queue-board/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── patients/
│   │   ├── register/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── libs/
│   │   └── i18n/
│   ├── providers/
│   └── middleware.ts
├── interface.ts
├── next.config.mjs
├── tailwind.config.js
└── package.json

Make sure that the code is clearn, well-structured, and follows best practices for the specified tech stack. Use appropriate design patterns and ensure that the code is maintainable and scalable. Production-ready code is expected, so handle edge cases and errors gracefully. Additionally, ensure that the frontend and backend are properly connected and can communicate effectively. Use environment variables for sensitive information and configuration settings. Finally, include documentation and comments in the code to explain the functionality and any important details.

Performance optimization and security best practices should also be considered during development. This includes optimizing database queries, implementing caching strategies, and ensuring that the application is secure against common vulnerabilities such as SQL injection, cross-site scripting (XSS), and cross-site request forgery (CSRF). Regularly test the application for performance and security issues, and make necessary improvements to ensure a smooth and secure user experience.

