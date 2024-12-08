const db = require('../config/db'); // Assuming you have a MySQL or any other DB connection setup

// Create user and insert into the lawyers table if email ends with @lawyer.com
const createUser = (name, email, password, callback) => {
  // Insert new user into the users table
  const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
  db.query(query, [name, email, password], (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);  // Log error details
      return callback(err);  // Return error to the callback
    }

    // If email ends with @lawyer.com, insert into the lawyers table
    if (email.endsWith('@lawyer.com')) {
      const userId = result.insertId;  // Get the user_id of the newly inserted user

      // Check if the user_id already exists in the lawyers table
      const checkLawyerQuery = 'SELECT * FROM lawyers WHERE user_id = ?';
      db.query(checkLawyerQuery, [userId], (err, lawyerResult) => {
        if (err) {
          console.error('Error checking lawyer:', err);  // Log error details
          return callback(err);  // Return error to the callback
        }

        // If user_id already exists in lawyers, do not insert again
        if (lawyerResult.length > 0) {
          console.log('Lawyer already exists for this user_id');
          return callback(null, result);  // Return the user creation result without inserting into lawyers
        }

        // If user is not a lawyer, insert into the lawyers table
        const lawyerQuery = 'INSERT INTO lawyers (user_id, name, specialization, ktpa, ratings, experience_years, contact, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const lawyerData = [userId, name, 'Unknown', 'Unknown', 0, 0, email, true];  // Default lawyer data

        db.query(lawyerQuery, lawyerData, (err, lawyerResult) => {
          if (err) {
            console.error('Error inserting into lawyers:', err);  // Log error details
            return callback(err);  // Return error to the callback
          }

          // Return user creation result (after inserting into lawyers)
          callback(null, result);  // Return the user creation result
        });
      });
    } else {
      // If the user is not a lawyer, just return the result of user creation
      callback(null, result);  // Return the user creation result
    }
  });
};

// Find user by email
const findUserByEmail = (email, callback) => {
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], callback);
};

// Update profile picture URL in the database
const updateUserProfilePicture = (userId, photoUrl, callback) => {
  const query = 'UPDATE users SET photoUrl = ? WHERE id = ?';
  db.query(query, [photoUrl, userId], (err, result) => {
    if (err) {
      console.error('Error updating profile picture:', err);  // Log error details
      return callback(err);  // Return error to the callback
    }

    // Return the result of the update operation
    callback(null, result);  // Successfully updated profile picture
  });
};

// Fetch user by ID, includes photo URL (if available)
const findUserById = (userId, callback) => {
  const query = 'SELECT * FROM users WHERE id = ?';
  db.query(query, [userId], callback);
};

module.exports = { createUser, findUserByEmail, updateUserProfilePicture, findUserById };
