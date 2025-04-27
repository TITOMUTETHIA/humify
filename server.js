const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

app.use(express.json());

// Secret key for JWT (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'humanline-secret-key-change-in-production';

// Centralized user database with IDs and hashed passwords
// In a real application, you'd retrieve users from a database
const users = [
    { id: 1, username: 'admin', password: '$2b$10$rPIuuVXXZVfYgm2Tg7iyJOQVVL1EpYcnQD9PZsHJz0cF7K3yKuUuy', role: 'admin' }, // admin123
    { id: 2, username: 'Peter', password: '$2b$10$IYu/WapDBnihBzxjNI7SJ.r3LRvfa3oIQym1juXCBUPA8G7w8qSMm', role: 'user' }, // password1
    { id: 3, username: 'Ann', password: '$2b$10$f.Yrt3gOZCk2Bp32DW.TEuJfPPP0mHfB0XLUobSAUaJcAEgDHLaHW', role: 'user' }, // password2
    // Added user from users.json with properly hashed password
    { id: 4, username: 'user1', password: '$2b$10$mB8EUeQbKQaxn1Jm8UzB9OZohvN4JTEfOu5SR2O/nSBEzSmM.21/W', role: 'user' }, // user123
    // Adding a driver user with hashed password
    { id: 5, username: 'driver1', password: '$2b$10$mLjm/zSXFvs9RI5pZpQcCOGvPVceZz7a92R.P7fYSQTnpMz4w3K.O', role: 'driver' } // driver123
];

// Authentication middleware - verifies JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. Authentication required.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user; // Attach decoded user to request
        next();
    });
};

// Role-based authorization middleware
const authorizeRole = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Check if user's role is in the allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        next();
    };
};

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Input validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user by username
        const user = users.find(u => u.username === username);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        // Return user info without password
        const { password: _, ...userInfo } = user;
        res.json({
            message: 'Login successful',
            user: userInfo,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Registration endpoint
app.post('/register', async (req, res) => {
    try {
        const { username, password, role = 'user' } = req.body;
        
        // Input validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Check if username already exists
        if (users.some(u => u.username === username)) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const newUser = {
            id: users.length + 1,
            username,
            password: hashedPassword,
            role
        };
        
        // Add to users array
        users.push(newUser);
        
        res.status(201).json({ 
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Signup endpoint (alias for register)
app.post('/signup', async (req, res) => {
    try {
        const { username, password, role = 'user' } = req.body;
        
        // Input validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Check if username already exists
        if (users.some(u => u.username === username)) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const newUser = {
            id: users.length + 1,
            username,
            password: hashedPassword,
            role
        };
        
        // Add to users array
        users.push(newUser);
        
        // Generate JWT token for immediate login
        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        res.status(201).json({ 
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role
            },
            token: token // Return token so user is logged in immediately
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Get all users (admin only)
app.get('/users', authenticateToken, authorizeRole(['admin']), (req, res) => {
    try {
        // Return users without passwords
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        res.json(usersWithoutPasswords);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Server error while fetching users' });
    }
});

// Get current user profile
app.get('/profile', authenticateToken, (req, res) => {
    try {
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Return user without password
        const { password, ...userInfo } = user;
        res.json(userInfo);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Server error while fetching profile' });
    }
});

// Add a driver-specific endpoint
app.get('/driver/routes', authenticateToken, authorizeRole(['driver', 'admin']), (req, res) => {
    try {
        // Example driver routes data
        const routes = [
            { id: 1, name: 'Downtown Route', status: 'active' },
            { id: 2, name: 'Airport Shuttle', status: 'pending' },
            { id: 3, name: 'Campus Circuit', status: 'completed' }
        ];
        
        res.json({
            driverInfo: req.user.username,
            routes: routes
        });
    } catch (error) {
        console.error('Error fetching driver routes:', error);
        res.status(500).json({ error: 'Server error while fetching routes' });
    }
});

// Add an admin endpoint to manage drivers
app.get('/admin/drivers', authenticateToken, authorizeRole(['admin']), (req, res) => {
    try {
        // Return only driver users without passwords
        const drivers = users
            .filter(u => u.role === 'driver')
            .map(({ password, ...driver }) => driver);
            
        res.json(drivers);
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ error: 'Server error while fetching drivers' });
    }
});

// Serve static files
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
