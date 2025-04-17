const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Centralized user database
const users = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'Peter', password: 'password1', role: 'user' },
    { username: 'Ann', password: 'password2', role: 'user' },
    { username: 'John', password: 'password3', role: 'user' },
    { username: 'Mary', password: 'password4', role: 'user' },
    { username: 'James', password: 'password5', role: 'user' },
    { username: 'Linda', password: 'password6', role: 'user' },
    { username: 'Robert', password: 'password7', role: 'user' },
    { username: 'Patricia', password: 'password8', role: 'user' },
    { username: 'Michael', password: 'password9', role: 'user' },
    { username: 'Barbara', password: 'password10', role: 'user' },
    { username: 'William', password: 'password11', role: 'user' },
    { username: 'Elizabeth', password: 'password12', role: 'user' },
    { username: 'David', password: 'password13', role: 'user' },
    { username: 'Jennifer', password: 'password14', role: 'user' },
    { username: 'Richard', password: 'password15', role: 'user' },
    { username: 'Susan', password: 'password16', role: 'user' },
    { username: 'Joseph', password: 'password17', role: 'user' },
    { username: 'Jessica', password: 'password18', role: 'user' },
    { username: 'Thomas', password: 'password19', role: 'user' },
    { username: 'Sarah', password: 'password20', role: 'user' },
];

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Find the user in the database
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Exclude admin from the user list
        const nonAdminUsers = users.filter(u => u.role !== 'admin');
        res.json({ user, users: nonAdminUsers });
    } else {
        res.status(401).json({ error: 'Invalid username or password' });
    }
});

// Endpoint to fetch all non-admin users
app.get('/users', (req, res) => {
    const nonAdminUsers = users.filter(u => u.role !== 'admin');
    res.json(nonAdminUsers);
});

// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
