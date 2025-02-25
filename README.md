# PG6301 Social Media Project

This is a simple **React + Express** application showcasing user registration, login, post creation, reactions, and comments. It is deployed on **Heroku**. The front end uses **Vite** for quick builds and **React Router** for navigation. The back end uses **Express** with session-based authentication.

## Data Storage
We chose a local `data.json` for speed and simplicity, avoiding a full database setup. This is suitable for small demos but not production.

## Verified vs. Unverified
Unverified users can react to and comment on posts but cannot create, edit, or delete. Verified users can create their own posts, then edit or delete them. We handle this with two middlewares: `requireLogin` (checks session) and `requireVerified` (checks if `verified === true`).

## Deployment
Hosted on Heroku in one app. We encountered errors like “Cannot find module \`@vitejs/plugin-react\`,” which we fixed by moving it into `dependencies`. Another issue was “Failed to fetch” in production, resolved by replacing `http://localhost:3001` with environment-based URLs.

## Local Setup
1. Clone the repo and run `npm install` in the root folder.  
2. Run `npm run install:client` and `npm run install:server`.  
3. Use `npm run dev` to start both server and client concurrently.  
4. Visit [http://localhost:5173](http://localhost:5173) to interact with the app.

## Future Improvements
A real database and more robust error handling would improve scalability. This project serves as a PG6301 assignment demo, focusing on basic web and API design principles.


<h1>Link til Github Repository:</h1>
https://github.com/kristiania-pg6301-2023/pg6301-reexam-AlsosCode

<h1>Link til Heroku:</h1>
https://my-simple-social-media-app-c200fde4e34f.herokuapp.com/