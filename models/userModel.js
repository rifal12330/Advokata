const createUser = (name, email, password, callback) => {
  // Menyisipkan pengguna baru ke dalam tabel users
  const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
  db.query(query, [name, email, password], (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);  // Menampilkan detail error
      return callback(err);
    }

    // Mengecek jika email berdomain @lawyer.com, maka insert ke tabel lawyers
    if (email.endsWith('@lawyer.com')) {
      const userId = result.insertId;  // Mengambil user_id yang baru dimasukkan

      // Mengecek apakah user_id sudah ada di tabel lawyers
      const checkLawyerQuery = 'SELECT * FROM lawyers WHERE user_id = ?';
      db.query(checkLawyerQuery, [userId], (err, lawyerResult) => {
        if (err) {
          console.error('Error checking lawyer:', err);  // Menampilkan detail error
          return callback(err);
        }

        // Jika user_id sudah ada di tabel lawyers, tidak melakukan insert lagi
        if (lawyerResult.length > 0) {
          console.log('Lawyer already exists for this user_id');
          return callback(null, result);  // Kembalikan hasil registrasi tanpa insert ke lawyers
        }

        // Jika tidak ada, lanjutkan untuk memasukkan data ke tabel lawyers
        const lawyerQuery = 'INSERT INTO lawyers (user_id, name, specialization, ktpa, ratings, experience_years, contact, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const lawyerData = [userId, name, 'Unknown', 'Unknown', 0, 0, email, true];
        
        db.query(lawyerQuery, lawyerData, (err, lawyerResult) => {
          if (err) {
            console.error('Error inserting into lawyers:', err);  // Menampilkan detail error
            return callback(err);
          }
          callback(null, result);  // Kembalikan hasil registrasi pengguna
        });
      });
    } else {
      callback(null, result);  // Kembalikan hasil registrasi pengguna tanpa input ke lawyers
    }
  });
};
