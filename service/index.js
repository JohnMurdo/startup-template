const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const express = require('express');
const path = require('path');
const uuid = require('uuid');
const config = require('../dbConfig.json');
const app = express();
const DB = require('./database.js');

const authCookieName = 'token';

// The service port may be set on the command line
const port = process.argv.length > 2 ? process.argv[2] : 3000;

// JSON body parsing using built-in middleware
app.use(express.json());

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
  const notes = await DB.getNotes(user.email);
  res.send(notes);
});

// Create Note
apiRouter.post('/notes', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  const note = {
    userEmail: user.email,
    content: req.body.content,
    date: new Date(),
  };
  await DB.addNote(note);
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

// Get Comments for a Post
apiRouter.get('/posts/:id/comments', async (req, res) => {
  const comments = await DB.getComments(req.params.id);
  res.send(comments);
});

// Add Comment to Post
apiRouter.post('/posts/:id/comments', verifyAuth, async (req, res) => {
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
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  });
}

async function fetchBibleApi(endpoint, query = {}) {
  const apiKey = config.bibleApiKey;
  const bibleId = config.bibleId || 'de4e12af7f28f599-01';
  if (!apiKey) {
    throw { status: 500, message: 'Missing Bible API key. Set bibleApiKey in dbConfig.json.' };
  }

  const url = new URL(`https://api.scripture.api.bible${endpoint}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      'api-key': apiKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw { status: response.status, message: `Bible API error: ${body}` };
  }
  return response.json();
}

let bibleBookMap = null;

async function getBibleBookId(bookKey) {
  if (!bibleBookMap) {
    const bibleId = config.bibleId || 'de4e12af7f28f599-01';
    const data = await fetchBibleApi(`/v1/bibles/${bibleId}/books`);
    bibleBookMap = {};
    for (const book of data.data) {
      const normalizedName = book.name.toLowerCase();
      const normalizedLong = (book.nameLong || '').toLowerCase();
      bibleBookMap[normalizedName] = book.id;
      bibleBookMap[normalizedLong] = book.id;
      bibleBookMap[book.abbreviation.toLowerCase()] = book.id;
      bibleBookMap[book.abbreviationLocal?.toLowerCase()] = book.id;
    }
  }

  const normalized = bookKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  return Object.entries(bibleBookMap).reduce((match, [key, id]) => {
    if (key.replace(/[^a-z0-9]/g, '') === normalized) {
      return id;
    }
    return match;
  }, null);
}

async function fetchBibleChapter(book, chapter) {
  const bibleId = config.bibleId || 'de4e12af7f28f599-01';
  const bookId = await getBibleBookId(book);
  if (!bookId) {
    throw { status: 404, message: 'Bible book not found' };
  }

  const chaptersResponse = await fetchBibleApi(`/v1/bibles/${bibleId}/books/${bookId}/chapters`);
  const chapterSummary = chaptersResponse.data.find((item) => item.number === String(chapter));
  if (!chapterSummary) {
    throw { status: 404, message: 'Chapter not found' };
  }

  const chapterResponse = await fetchBibleApi(`/v1/bibles/${bibleId}/chapters/${chapterSummary.id}`, {
    'content-type': 'text',
    'include-verse-numbers': 'true',
  });
  return chapterResponse.data;
}

const httpService = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
