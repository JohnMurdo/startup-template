const { MongoClient, ObjectId } = require('mongodb');
const config = require('../dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('bibleapp');
const userCollection = db.collection('user');
const noteCollection = db.collection('note');
const postCollection = db.collection('post');
const commentCollection = db.collection('comment');

// This will asynchronously test the connection and exit the process if it fails
(async function testConnection() {
  try {
    await db.command({ ping: 1 });
    console.log(`Connect to database`);
  } catch (ex) {
    console.log(`Unable to connect to database with ${url} because ${ex.message}`);
    process.exit(1);
  }
})();

function getUser(email) {
  return userCollection.findOne({ email: email });
}

function getUserByToken(token) {
  return userCollection.findOne({ token: token });
}

async function addUser(user) {
  await userCollection.insertOne(user);
}

async function updateUser(user) {
  await userCollection.updateOne({ email: user.email }, { $set: user });
}

async function updateUserRemoveAuth(user) {
  await userCollection.updateOne({ email: user.email }, { $unset: { token: 1 } });
}

async function addNote(note) {
  return noteCollection.insertOne(note);
}

function getNotes(userEmail, book, chapter) {
  const query = { userEmail };
  if (book) {
    query.book = book;
  }
  if (chapter != null) {
    query.chapter = chapter;
  }
  return noteCollection.find(query).sort({ date: -1 }).toArray();
}

async function updateNote(noteId, updates) {
  return noteCollection.updateOne({ _id: new ObjectId(noteId) }, { $set: updates });
}

async function deleteNote(noteId, userEmail) {
  return noteCollection.deleteOne({ _id: new ObjectId(noteId), userEmail });
}

async function addPost(post) {
  return postCollection.insertOne(post);
}

function getPosts() {
  return postCollection.find().sort({ date: -1 }).toArray();
}

async function addComment(comment) {
  return commentCollection.insertOne(comment);
}

function getComments(postId) {
  return commentCollection.find({ postId: new ObjectId(postId) }).sort({ date: 1 }).toArray();
}

module.exports = {
  getUser,
  getUserByToken,
  addUser,
  updateUser,
  updateUserRemoveAuth,
  addNote,
  getNotes,
  updateNote,
  deleteNote,
  addPost,
  getPosts,
  addComment,
  getComments,
};
