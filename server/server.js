import express from 'express';
import cors from 'cors';
import session from 'express-session';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const DATA_PATH = path.join(__dirname, 'data.json');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(bodyParser.json());

app.use(
  session({
    secret: 'some-secret-string',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// -------------------------------------
// Helper Functions
// -------------------------------------
function readData() {
  const data = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(data);
}

function writeData(jsonData) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(jsonData, null, 2), 'utf8');
}

function generateId(array) {
  return array.length > 0 ? Math.max(...array.map((item) => item.id)) + 1 : 1;
}

function requireLogin(req, res, next) {
  // 1) Must be logged in
  if (!req.session.user) {
    return res.status(403).json({ success: false, message: 'Not logged in' });
  }
  // 2) Must be verified
  if (!req.session.user.verified) {
    return res.status(403).json({ success: false, message: 'User not verified' });
  }
  next();
}


// -------------------------------------
// Google Login Setup
// -------------------------------------

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const data = readData();
  const user = data.users.find((u) => u.id === id);
  if (user) {
    done(null, user);
  } else {
    done(null, false);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3001/auth/google/callback'
    },
    (accessToken, refreshToken, profile, done) => {
      const data = readData();
      let user = data.users.find((u) => u.googleId === profile.id);

      if (!user) {
        const newId = generateId(data.users);
        user = {
          id: newId,
          googleId: profile.id,
          name: profile.displayName || 'Unnamed',
          username:
            (profile.emails && profile.emails[0] && profile.emails[0].value) ||
            `googleUser${newId}@example.com`,
          profileImage: profile.photos?.[0]?.value || 'https://via.placeholder.com/100',
          password: null,
          verified: true 
        };
        data.users.push(user);
        writeData(data);
      }

      done(null, user);
    }
  )
);

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
  (req, res) => {
    const { id, name, username, verified } = req.user;
    req.session.user = { id, name, username, verified };
    res.redirect('http://localhost:5173/profile');
  }
);

// -------------------------------------
// Auth Routes (Local Login)
// -------------------------------------
app.post('/api/register', async (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  const data = readData();
  const existingUser = data.users.find((u) => u.username === username);
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Username taken' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = {
    id: generateId(data.users),
    username,
    password: hashed,
    name,
    profileImage: 'https://via.placeholder.com/100',
    verified: false 
  };
  data.users.push(newUser);
  writeData(data);

  return res.json({ success: true, message: 'Registered successfully' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const data = readData();

  const user = data.users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  req.session.user = { id: user.id, name: user.name, username: user.username, verified: user.verified};
  return res.json({ success: true, user: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/session', (req, res) => {
  if (req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  }
  return res.json({ loggedIn: false });
});

app.get('/api/users/:id', (req, res) => {
  const data = readData();
  const user = data.users.find((u) => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({
    id: user.id,
    name: user.name,
    username: user.username,
    profileImage: user.profileImage
  });
});

// -------------------------------------
// Posts
// -------------------------------------
app.get('/api/posts', (req, res) => {
  const data = readData();
  const sorted = [...data.posts].sort((a, b) => b.id - a.id);
  res.json(sorted);
});

app.get('/api/posts/:postId', (req, res) => {
  const data = readData();
  const post = data.posts.find((p) => p.id === parseInt(req.params.postId));
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  const author = data.users.find((u) => u.id === post.authorId);
  const reactions = post.reactions.map((r) => {
    const user = data.users.find((u) => u.id === r.userId);
    return {
      userId: r.userId,
      username: user ? user.username : 'Unknown',
      reaction: r.reaction
    };
  });
  const comments = post.comments.map((c) => {
    const user = data.users.find((u) => u.id === c.userId);
    return {
      id: c.id,
      text: c.text,
      userId: c.userId,
      username: user ? user.username : 'Unknown'
    };
  });

  res.json({
    ...post,
    authorName: author ? author.name : 'Unknown',
    authorImage: author ? author.profileImage : null,
    reactions,
    comments
  });
});

app.post('/api/posts', requireLogin, (req, res) => {
  const { title, text } = req.body;
  if (!title || !text) {
    return res.status(400).json({ success: false, message: 'Title and text are required' });
  }
  if (text.length < 10 || text.length > 1000) {
    return res.status(400).json({ success: false, message: 'Text must be 10-1000 characters' });
  }

  const data = readData();
  const newPost = {
    id: generateId(data.posts),
    authorId: req.session.user.id,
    title,
    text,
    reactions: [],
    comments: []
  };
  data.posts.push(newPost);
  writeData(data);

  res.json({ success: true, post: newPost });
});

app.put('/api/posts/:postId', requireLogin, (req, res) => {
  const { postId } = req.params;
  const { title, text } = req.body;
  const data = readData();
  const post = data.posts.find((p) => p.id === parseInt(postId));
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }
  if (post.authorId !== req.session.user.id) {
    return res.status(403).json({ success: false, message: 'Not your post' });
  }

  if (text && (text.length < 10 || text.length > 1000)) {
    return res
      .status(400)
      .json({ success: false, message: 'Text must be 10-1000 characters' });
  }

  if (title !== undefined) post.title = title;
  if (text !== undefined) post.text = text;

  writeData(data);
  res.json({ success: true, post });
});

app.delete('/api/posts/:postId', requireLogin, (req, res) => {
  const { postId } = req.params;
  const data = readData();
  const postIndex = data.posts.findIndex((p) => p.id === parseInt(postId));
  if (postIndex === -1) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  const post = data.posts[postIndex];
  if (post.authorId !== req.session.user.id) {
    return res.status(403).json({ success: false, message: 'Not your post' });
  }

  data.posts.splice(postIndex, 1);
  writeData(data);
  res.json({ success: true, message: 'Post deleted' });
});

app.post('/api/posts/:postId/react', requireLogin, (req, res) => {
  const { postId } = req.params;
  const { reaction } = req.body;
  if (!reaction) {
    return res
      .status(400)
      .json({ success: false, message: 'Reaction is required' });
  }

  const data = readData();
  const post = data.posts.find((p) => p.id === parseInt(postId));
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  post.reactions.push({ userId: req.session.user.id, reaction });
  writeData(data);

  res.json({ success: true });
});

app.post('/api/posts/:postId/comments', requireLogin, (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  if (!text) {
    return res
      .status(400)
      .json({ success: false, message: 'Comment text is required' });
  }

  const data = readData();
  const post = data.posts.find((p) => p.id === parseInt(postId));
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  const newComment = {
    id: generateId(post.comments),
    userId: req.session.user.id,
    text
  };
  post.comments.push(newComment);
  writeData(data);

  res.json({ success: true });
});

// If you built your React app into `client/dist`:
const clientBuildPath = path.join(__dirname, '../client/dist');

// Serve the static files
app.use(express.static(clientBuildPath));

// For any GET request that doesn’t match an API route, send back React’s index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// -------------------------------------
// Start Server
// -------------------------------------
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
