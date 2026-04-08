const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const express = require('express');
const path = require('path');
const uuid = require('uuid');
const WebSocket = require('ws');
const config = require('../dbConfig.json');
const app = express();
const DB = require('./database.js');

const authCookieName = 'token';

// The service port may be set on the command line
const port = process.argv.length > 2 ? process.argv[2] : 3000;

// JSON body parsing using built-in middleware
app.use(express.json());

// Allow cross-origin requests from the dev server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Use the cookie parser middleware for tracking authentication tokens
app.use(cookieParser());

// Serve up the application's static content from the project root public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// Router for service endpoints
const apiRouter = express.Router();
app.use(`/api`, apiRouter);

// CreateAuth token for a new user
apiRouter.post('/auth/create', async (req, res) => {
  if (await findUser('email', req.body.email)) {
    res.status(409).send({ msg: 'Existing user' });
  } else {
    const user = await createUser(req.body.email, req.body.password);

    setAuthCookie(res, user.token);
    res.send({ email: user.email });
  }
});

// GetAuth token for the provided credentials
apiRouter.post('/auth/login', async (req, res) => {
  const user = await findUser('email', req.body.email);
  if (user) {
    if (await bcrypt.compare(req.body.password, user.password)) {
      user.token = uuid.v4();
      await DB.updateUser(user);
      setAuthCookie(res, user.token);
      res.send({ email: user.email });
      return;
    }
  }
  res.status(401).send({ msg: 'Unauthorized' });
});

// DeleteAuth token if stored in cookie
apiRouter.delete('/auth/logout', async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user) {
    await DB.updateUserRemoveAuth(user);
  }
  res.clearCookie(authCookieName);
  res.status(204).end();
});

// Middleware to verify that the user is authorized to call an endpoint
const verifyAuth = async (req, res, next) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user) {
    next();
  } else {
    res.status(401).send({ msg: 'Unauthorized' });
  }
};

// Get Notes
apiRouter.get('/notes', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  const { book, chapter } = req.query;
  const notes = await DB.getNotes(user.email, book, chapter ? parseInt(chapter, 10) : undefined);
  res.send(notes);
});

// Create Note
apiRouter.post('/notes', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  const note = {
    userEmail: user.email,
    content: req.body.content,
    book: req.body.book || null,
    chapter: req.body.chapter ? parseInt(req.body.chapter, 10) : null,
    isPublic: req.body.isPublic || false,
    likes: [],
    date: new Date(),
  };
  const result = await DB.addNote(note);
  note._id = result.insertedId;
  res.status(201).send(note);
});

// Update Note
apiRouter.put('/notes/:id', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  await DB.updateNote(req.params.id, { content: req.body.content });
  res.status(204).end();
});

// Delete Note
apiRouter.delete('/notes/:id', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  await DB.deleteNote(req.params.id, user.email);
  res.status(204).end();
});

// Get Posts
apiRouter.get('/posts', async (req, res) => {
  const posts = await DB.getPosts();
  res.send(posts);
});

// Create Post
apiRouter.post('/posts', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  const post = {
    userEmail: user.email,
    content: req.body.content,
    date: new Date(),
  };
  const result = await DB.addPost(post);
  post._id = result.insertedId;
  res.status(201).send(post);
});

// Get Comments for a Note
apiRouter.get('/notes/:id/comments', async (req, res) => {
  const comments = await DB.getComments(req.params.id);
  res.send(comments);
});

// Get Comments for a Post (legacy compatibility)
apiRouter.get('/posts/:id/comments', async (req, res) => {
  const comments = await DB.getComments(req.params.id);
  res.send(comments);
});

// Add Comment to Note
apiRouter.post('/notes/:id/comments', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  const comment = {
    postId: req.params.id,
    userEmail: user.email,
    content: req.body.content,
    date: new Date(),
  };
  await DB.addComment(comment);
  res.status(201).send(comment);
});

// Get Public Notes
apiRouter.get('/public-notes', async (req, res) => {
  const notes = await DB.getPublicNotes();
  res.send(notes);
});

// Like Note
apiRouter.post('/notes/:id/like', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  await DB.likeNote(req.params.id, user.email);
  res.status(204).end();
});

// Unlike Note
apiRouter.delete('/notes/:id/like', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  await DB.unlikeNote(req.params.id, user.email);
  res.status(204).end();
});

// Like Comment
apiRouter.post('/comments/:id/like', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  await DB.likeComment(req.params.id, user.email);
  res.status(204).end();
});

// Unlike Comment
apiRouter.delete('/comments/:id/like', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  await DB.unlikeComment(req.params.id, user.email);
  res.status(204).end();
});

// Get Bible Chapter
apiRouter.get('/bible/:book/:chapter', async (req, res) => {
  try {
    const chapter = await fetchBibleChapter(req.params.book, req.params.chapter);
    if (!chapter) {
      return res.status(404).send({ msg: 'Chapter not found' });
    }
    res.send(chapter);
  } catch (err) {
    res.status(err.status || 500).send({ msg: err.message });
  }
});

// Default error handler
app.use(function (err, req, res, next) {
  res.status(500).send({ type: err.name, message: err.message });
});

// Return the application's default page if the path is unknown
app.use((_req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, '..', 'public') });
});

async function createUser(email, password) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    email: email,
    password: passwordHash,
    token: uuid.v4(),
  };
  await DB.addUser(user);

  return user;
}

async function findUser(field, value) {
  if (!value) return null;

  if (field === 'token') {
    return DB.getUserByToken(value);
  }
  return DB.getUser(value);
}

// setAuthCookie in the HTTP response
function setAuthCookie(res, authToken) {
  res.cookie(authCookieName, authToken, {
    maxAge: 1000 * 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
  });
}

const BOOK_ID_MAP = {
  'genesis': 'genesis',
  'exodus': 'exodus',
  'leviticus': 'leviticus',
  'numbers': 'numbers',
  'deuteronomy': 'deuteronomy',
  'joshua': 'joshua',
  'judges': 'judges',
  'ruth': 'ruth',
  '1 samuel': '1samuel',
  '1samuel': '1samuel',
  '2 samuel': '2samuel',
  '2samuel': '2samuel',
  '1 kings': '1kings',
  '1kings': '1kings',
  '2 kings': '2kings',
  '2kings': '2kings',
  '1 chronicles': '1chronicles',
  '1chronicles': '1chronicles',
  '2 chronicles': '2chronicles',
  '2chronicles': '2chronicles',
  'ezra': 'ezra',
  'nehemiah': 'nehemiah',
  'esther': 'esther',
  'job': 'job',
  'psalm': 'psalm',
  'psalms': 'psalm',
  'proverbs': 'proverbs',
  'ecclesiastes': 'ecclesiastes',
  'isaiah': 'isaiah',
  'jeremiah': 'jeremiah',
  'lamentations': 'lamentations',
  'ezekiel': 'ezekiel',
  'daniel': 'daniel',
  'hosea': 'hosea',
  'joel': 'joel',
  'amos': 'amos',
  'obadiah': 'obadiah',
  'jonah': 'jonah',
  'micah': 'micah',
  'nahum': 'nahum',
  'habakkuk': 'habakkuk',
  'zephaniah': 'zephaniah',
  'haggai': 'haggai',
  'zechariah': 'zechariah',
  'malachi': 'malachi',
  'matthew': 'matthew',
  'mark': 'mark',
  'luke': 'luke',
  'john': 'john',
  'acts': 'acts',
  'romans': 'romans',
  '1 corinthians': '1corinthians',
  '1corinthians': '1corinthians',
  '2 corinthians': '2corinthians',
  '2corinthians': '2corinthians',
  'galatians': 'galatians',
  'ephesians': 'ephesians',
  'philippians': 'philippians',
  'colossians': 'colossians',
  '1 thessalonians': '1thessalonians',
  '1thessalonians': '1thessalonians',
  '2 thessalonians': '2thessalonians',
  '2thessalonians': '2thessalonians',
  '1 timothy': '1timothy',
  '1timothy': '1timothy',
  '2 timothy': '2timothy',
  '2timothy': '2timothy',
  'titus': 'titus',
  'philemon': 'philemon',
  'hebrews': 'hebrews',
  'james': 'james',
  '1 peter': '1peter',
  '1peter': '1peter',
  '2 peter': '2peter',
  '2peter': '2peter',
  '1 john': '1john',
  '1john': '1john',
  '2 john': '2john',
  '2john': '2john',
  '3 john': '3john',
  '3john': '3john',
  'jude': 'jude',
  'revelation': 'revelation',
};

function normalizeBookKey(bookKey) {
  const normalized = bookKey.toLowerCase().trim();
  return BOOK_ID_MAP[normalized] || normalized;
}

async function fetchOpenScriptureApi(endpoint) {
  const baseUrl = 'https://openscriptureapi.org/api/scriptures/v1/lds/en';
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw { status: response.status, message: `Open Scripture API error: ${body}` };
  }
  return response.json();
}

async function fetchBibleChapter(book, chapter) {
  const bookId = normalizeBookKey(book);
  
  try {
    const chapterData = await fetchOpenScriptureApi(`/book/${bookId}/${chapter}`);
    return chapterData;
  } catch (err) {
    throw { status: 404, message: `Could not find ${book} chapter ${chapter}` };
  }
}

const httpService = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server: httpService });

const clients = new Map();

wss.on('connection', (ws, req) => {
  const userId = uuid.v4();
  clients.set(userId, ws);
  console.log(`WebSocket client connected: ${userId}`);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received WebSocket message:', data);

      // Handle different message types
      if (data.type === 'like_note') {
        await handleLikeNote(data, userId);
      } else if (data.type === 'unlike_note') {
        await handleUnlikeNote(data, userId);
      } else if (data.type === 'like_comment') {
        await handleLikeComment(data, userId);
      } else if (data.type === 'unlike_comment') {
        await handleUnlikeComment(data, userId);
      } else if (data.type === 'new_comment') {
        await handleNewComment(data, userId);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(userId);
    console.log(`WebSocket client disconnected: ${userId}`);
  });
});

async function handleLikeNote(data, userId) {
  try {
    const user = await findUser('token', data.token);
    if (!user) return;

    await DB.likeNote(data.noteId, user.email);
    broadcastToAll({ type: 'note_liked', noteId: data.noteId, userEmail: user.email });
  } catch (error) {
    console.error('Error liking note:', error);
  }
}

async function handleUnlikeNote(data, userId) {
  try {
    const user = await findUser('token', data.token);
    if (!user) return;

    await DB.unlikeNote(data.noteId, user.email);
    broadcastToAll({ type: 'note_unliked', noteId: data.noteId, userEmail: user.email });
  } catch (error) {
    console.error('Error unliking note:', error);
  }
}

async function handleLikeComment(data, userId) {
  try {
    const user = await findUser('token', data.token);
    if (!user) return;

    await DB.likeComment(data.commentId, user.email);
    broadcastToAll({ type: 'comment_liked', commentId: data.commentId, userEmail: user.email });
  } catch (error) {
    console.error('Error liking comment:', error);
  }
}

async function handleUnlikeComment(data, userId) {
  try {
    const user = await findUser('token', data.token);
    if (!user) return;

    await DB.unlikeComment(data.commentId, user.email);
    broadcastToAll({ type: 'comment_unliked', commentId: data.commentId, userEmail: user.email });
  } catch (error) {
    console.error('Error unliking comment:', error);
  }
}

async function handleNewComment(data, userId) {
  try {
    const user = await findUser('token', data.token);
    if (!user) return;

    const comment = {
      postId: data.noteId,
      userEmail: user.email,
      content: data.content,
      date: new Date(),
    };
    await DB.addComment(comment);
    const comments = await DB.getComments(data.noteId);
    broadcastToAll({ type: 'comments_updated', postId: data.noteId, comments });
  } catch (error) {
    console.error('Error adding comment:', error);
  }
}

function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}
