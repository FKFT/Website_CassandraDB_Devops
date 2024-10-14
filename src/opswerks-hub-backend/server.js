const express = require('express');
const bodyParser = require('body-parser');
const cassandra = require('cassandra-driver');
const cors = require('cors');
const { register, collectDefaultMetrics, Histogram } = require('prom-client');

const app = express();
const port = process.env.PORT || 5000;
const environment = process.env.NODE_ENV || 'development';

const keyspace = environment === 'production' 
  ? 'opswerkshubkeyspace_prod' 
  : 'opswerkshubkeyspace_dev';

console.log(process.env.NODE_ENV, "NODE_ENV");
console.log(environment, "environment");
console.log(keyspace, "keyspace");

app.use(bodyParser.json());

// Cassandra connection setup
const cassandraHost = 'opswerks-hub-database-service'; // Internal ip name of the database
const client = new cassandra.Client({
  contactPoints: [cassandraHost],  
  localDataCenter: 'datacenter1', // Keep as 'datacenter1'
});

// Keyspace and table creation queries
const keyspaceQuery = `
  CREATE KEYSPACE IF NOT EXISTS ${keyspace}
  WITH REPLICATION = {
    'class': 'SimpleStrategy',
    'replication_factor': 1
  };
`;

const usersTableQuery = `
  CREATE TABLE IF NOT EXISTS ${keyspace}.users (
    email TEXT PRIMARY KEY,
    password TEXT,
    loggedIn BOOLEAN
  );
`;

const likedPostsTableQuery = `
  CREATE TABLE IF NOT EXISTS ${keyspace}.liked_posts (
    postId BIGINT,
    email TEXT,
    PRIMARY KEY (postId, email)
  );
`;

const postsTableQuery = `
  CREATE TABLE IF NOT EXISTS ${keyspace}.posts (
    id BIGINT PRIMARY KEY,
    username TEXT,
    title TEXT,
    content TEXT,
    like INT,
    comments LIST<FROZEN<MAP<TEXT, TEXT>>>
  );
`;

// Maximum number of connection attempts
const MAX_ATTEMPTS = 10; 
const RETRY_INTERVAL = 5000; 

async function connectToCassandra(attempt = 1) {
  try {
    await client.connect();
    console.log('Connected to Cassandra without keyspace');
    
    await setupDatabase();
    
  } catch (err) {
    console.error(`Attempt ${attempt}: Failed to connect to Cassandra:`, err);
    
    if (attempt < MAX_ATTEMPTS) {
      console.log(`Retrying in ${RETRY_INTERVAL / 1000} seconds...`);
      setTimeout(() => connectToCassandra(attempt + 1), RETRY_INTERVAL);
    } else {
      console.error('Max attempts reached. Could not connect to Cassandra.');
      process.exit(1); // Exit the process if all attempts fail
    }
  }
}

// Function to set up the database
async function setupDatabase() {
  try {
    // Create keyspace
    await client.execute(keyspaceQuery.replace('opswerkshubkeyspace_dev', keyspace));
    console.log('Keyspace created/verified.');

    console.log(keyspace, 'is currently being used');

    client.keyspace = keyspace; 

    await client.execute(usersTableQuery);
    console.log('Users table created/verified.');

    await client.execute(likedPostsTableQuery);
    console.log('Liked Posts table created/verified.');

    await client.execute(postsTableQuery);
    console.log('Posts table created/verified.');

    console.log('Database initiated successfully');
  } catch (tableError) {
    console.error('Error setting up database:', tableError);
  }
}

connectToCassandra();

// CORS configuration
const corsOrigin = 'http://172.104.38.128:80'; // External ip of the frontend with protocol and port
app.use(cors({
  origin: corsOrigin.split(','), // Split to allow multiple origins from comma-separated string
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Routes
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.get('/api/try', (req, res) => {
  res.send('Hi from the backend!');
});

app.post('/api/data/users', async (req, res) => {
  const { email, password, loggedIn } = req.body;

  const query = 'INSERT INTO users (email, password, loggedIn) VALUES (?, ?, ?)';
  const params = [email, password, loggedIn];

  try {
    await client.execute(query, params, { prepare: true });
    res.status(200).send('User inserted successfully');
  } catch (err) {
    console.error('Error inserting user:', err);
    res.status(500).send('Error inserting user');
  }
});

app.get('/api/data/users', async (req, res) => {
  const query = 'SELECT * FROM users';

  try {
    const result = await client.execute(query);
    if (result.rows.length === 0) {
      return res.status(404).send('No users found');
    }
    res.status(200).json(result.rows);  
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Error fetching users');
  }
});

app.put('/api/data/users', async (req, res) => {
  const { email, loggedIn, password } = req.body; 

  if (!email) {
    return res.status(400).send('Email is required'); 
  }

  let updateFields = []; 
  let params = [];  

  if (loggedIn !== undefined) {
    updateFields.push('loggedIn = ?');
    params.push(loggedIn);
  }

  if (password !== undefined) {
    updateFields.push('password = ?');
    params.push(password);
  }

  if (updateFields.length === 0) {
    return res.status(400).send('No fields to update');
  }

  params.push(email);

  const query = `UPDATE users SET ${updateFields.join(', ')} WHERE email = ?`;

  try {
    const result = await client.execute(query, params, { prepare: true });

    if (result.rowLength === 0) {
      return res.status(404).send('User not found');
    }

    res.status(200).send('User updated successfully');
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).send('Error updating user');
  }
});

app.post('/api/data/likedPosts', async (req, res) => {
  const { postId, email } = req.body;

  const query = 'INSERT INTO liked_posts (postId, email) VALUES (?, ?)';
  const params = [postId, email];

  try {
    await client.execute(query, params, { prepare: true });
    res.status(200).send('Liked post inserted successfully');
  } catch (err) {
    console.error('Error inserting liked post:', err);
    res.status(500).send('Error inserting liked post');
  }
});

app.get('/api/data/likedPosts', async (req, res) => {
  const query = 'SELECT * FROM liked_posts';

  try {
    const result = await client.execute(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching liked posts:', err);
    res.status(500).send('Error fetching liked posts');
  }
});

app.put('/api/data/likedPosts', async (req, res) => {
  const { postid, email } = req.body;

  if (!postid || !email) {
    return res.status(400).send('Both postId and email are required');
  }

  const query = 'INSERT INTO liked_posts (postId, email) VALUES (?, ?)';
  const params = [postid, email];

  try {
    await client.execute(query, params, { prepare: true });
    res.status(200).send('Liked post updated successfully');
  } catch (err) {
    console.error('Error updating liked post:', err);
    res.status(500).send('Error updating liked post');
  }
});

app.delete('/api/data/likedPosts', async (req, res) => {
  const { postId, email } = req.body;

  if (!postId || !email) {
    return res.status(400).send('Both postId and email are required');
  }

  const query = 'DELETE FROM liked_posts WHERE email = ? AND postId = ?';
  const params = [email, postId];

  try {
    const result = await client.execute(query, params, { prepare: true });

    if (result && result.rowLength === 0) {
      return res.status(404).send('Liked post not found for the given email and postId');
    }

    res.status(200).send('Liked post deleted successfully');
  } catch (err) {
    console.error('Error deleting liked post:', err);
    res.status(500).send('Error deleting liked post');
  }
});

app.post('/api/data/posts', async (req, res) => {
  const { id, username, title, content, like, comments } = req.body;

  const query = 'INSERT INTO posts (id, username, title, content, like, comments) VALUES (?, ?, ?, ?, ?, ?)';
  const params = [id, username, title, content, like, comments];

  try {
    await client.execute(query, params, { prepare: true });
    res.status(200).send('Post inserted successfully');
  } catch (err) {
    console.error('Error inserting post:', err);
    res.status(500).send('Error inserting post');
  }
});

app.get('/api/data/posts', async (req, res) => {
  const query = 'SELECT * FROM posts';

  try {
    const result = await client.execute(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).send('Error fetching posts');
  }
});


app.put('/api/data/posts', async (req, res) => {
  const { id, comments } = req.body;

  if (!id) {
    return res.status(400).send('Post ID is required');
  }

  if (!Array.isArray(comments)) {
    return res.status(400).send('Comments must be an array');
  }

  try {
    const fetchQuery = 'SELECT comments FROM posts WHERE id = ?';
    const postResult = await client.execute(fetchQuery, [id], { prepare: true });

    if (postResult.rowLength === 0) {
      return res.status(404).send('Post not found');
    }

    let currentComments = postResult.rows[0].comments || [];

    currentComments = [...currentComments, ...comments];

    const updateQuery = 'UPDATE posts SET comments = ? WHERE id = ?';
    const params = [currentComments, id];
    const result = await client.execute(updateQuery, params, { prepare: true });

    if (result.rowLength === 0) {
      return res.status(404).send('Post not found');
    }

    res.status(200).send('Post comments updated successfully');
  } catch (err) {
    console.error('Error updating post comments:', err);
    res.status(500).send('Error updating post comments');
  }
});

app.delete('/api/data/posts', async (req, res) => {
  const { id } = req.body;  

  if (!id) {
    return res.status(400).send('Post ID is required');  
  }
  const query = 'DELETE FROM posts WHERE id = ?';  
  const params = [id];  
  try {
    const result = await client.execute(query, params, { prepare: true });  
    res.status(200).send(`Post with ID ${id} deleted successfully`);
  } catch (err) {
    console.error('Error deleting post:', err);  
    res.status(500).send('Error deleting post'); 
  }
});

// Prometheus

// Prometheus setup
collectDefaultMetrics(); // Collect default metrics
const httpRequestDurationMicroseconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
});

app.get('/api/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Track request duration
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
